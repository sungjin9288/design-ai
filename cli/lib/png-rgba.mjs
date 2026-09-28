// Minimal dependency-free PNG codec for visual evaluators.
// Decodes non-interlaced 8-bit RGB or RGBA images into RGBA pixels and encodes
// RGBA pixels back to PNG. Anything else is rejected with a named reason so an
// evaluator can report the artifact as unverified instead of guessing.
import { deflateSync, inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = Object.freeze({ 2: 3, 6: 4 });
const SUPPORTED_CRITICAL = new Set(["IHDR", "IDAT", "IEND"]);
const MAX_PIXELS = 40_000_000;
const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readChunks(buffer) {
  if (buffer.length < SIGNATURE.length || !buffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error("not a PNG file");
  }
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error(`PNG chunk ${type} is truncated`);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (crc32(buffer.subarray(offset + 4, offset + 8 + length)) !== buffer.readUInt32BE(offset + 8 + length)) {
      throw new Error(`PNG chunk ${type} has an invalid CRC`);
    }
    // An uppercase first letter marks a critical chunk; one we cannot interpret (such as PLTE)
    // changes how pixels decode, so it is refused rather than ignored.
    if (/^[A-Z]/.test(type) && !SUPPORTED_CRITICAL.has(type)) throw new Error(`PNG critical chunk ${type} is not supported`);
    chunks.push({ type, body });
    offset = end;
    if (type === "IEND") return chunks;
  }
  throw new Error("PNG has no IEND chunk");
}

function header(chunks) {
  const ihdr = chunks[0];
  if (!ihdr || ihdr.type !== "IHDR" || ihdr.body.length !== 13) throw new Error("PNG must start with IHDR");
  const width = ihdr.body.readUInt32BE(0);
  const height = ihdr.body.readUInt32BE(4);
  const [depth, colorType, compression, filter, interlace] = ihdr.body.subarray(8, 13);
  if (!width || !height || width * height > MAX_PIXELS) throw new Error("PNG dimensions are out of range");
  if (depth !== 8 || !CHANNELS[colorType]) throw new Error("PNG must be 8-bit RGB or RGBA");
  if (compression !== 0 || filter !== 0 || interlace !== 0) throw new Error("PNG must be non-interlaced");
  return { width, height, channels: CHANNELS[colorType] };
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const toLeft = Math.abs(estimate - left);
  const toUp = Math.abs(estimate - up);
  const toUpLeft = Math.abs(estimate - upLeft);
  if (toLeft <= toUp && toLeft <= toUpLeft) return left;
  return toUp <= toUpLeft ? up : upLeft;
}

function unfilter(data, { width, height, channels }) {
  const stride = width * channels;
  if (data.length !== height * (stride + 1)) throw new Error("PNG image data has the wrong length");
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y += 1) {
    const type = data[y * (stride + 1)];
    if (type > 4) throw new Error(`PNG row ${y} has an unknown filter`);
    for (let x = 0; x < stride; x += 1) {
      const raw = data[y * (stride + 1) + 1 + x];
      const left = x >= channels ? out[y * stride + x - channels] : 0;
      const up = y > 0 ? out[(y - 1) * stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][type];
      out[y * stride + x] = (raw + predictor) & 0xff;
    }
  }
  return out;
}

export function decodePng(buffer) {
  const chunks = readChunks(buffer);
  const info = header(chunks);
  const compressed = Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.body));
  if (!compressed.length) throw new Error("PNG has no image data");
  let data;
  try {
    // Cap the output at the size the header declares, so a small file cannot inflate without bound.
    data = inflateSync(compressed, { maxOutputLength: info.height * (info.width * info.channels + 1) });
  } catch (error) {
    throw new Error(`PNG image data does not inflate: ${error.message}`);
  }
  const pixels = unfilter(data, info);
  if (info.channels === 4) return { width: info.width, height: info.height, rgba: pixels };
  const rgba = new Uint8Array(info.width * info.height * 4);
  for (let source = 0, target = 0; source < pixels.length; source += 3, target += 4) {
    rgba.set(pixels.subarray(source, source + 3), target);
    rgba[target + 3] = 255;
  }
  return { width: info.width, height: info.height, rgba };
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "latin1");
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function encodePng(width, height, rgba) {
  if (rgba.length !== width * height * 4) throw new Error("RGBA buffer does not match the dimensions");
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    rows.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}
