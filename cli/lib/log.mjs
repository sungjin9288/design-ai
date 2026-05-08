// Terminal output helpers.

const isTTY = process.stdout.isTTY;
const noColor = process.env.NO_COLOR || !isTTY;

const codes = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const c = (color) => (s) => noColor ? s : `${codes[color]}${s}${codes.reset}`;

export const bold = c("bold");
export const dim = c("dim");
export const red = c("red");
export const green = c("green");
export const yellow = c("yellow");
export const blue = c("blue");
export const cyan = c("cyan");

export const info = (msg) => console.log(`${blue("ℹ")}  ${msg}`);
export const success = (msg) => console.log(`${green("✓")}  ${msg}`);
export const warn = (msg) => console.log(`${yellow("⚠")}  ${msg}`);
export const error = (msg) => console.error(`${red("✗")}  ${msg}`);

export function header(title, subtitle) {
  if (noColor) {
    console.log(`\n  ${title}`);
    if (subtitle) console.log(`  ${subtitle}`);
    console.log();
    return;
  }
  const w = 64;
  const top = `${codes.blue}╔${"═".repeat(w - 2)}╗${codes.reset}`;
  const bot = `${codes.blue}╚${"═".repeat(w - 2)}╝${codes.reset}`;
  const pad = (s) => `${codes.blue}║${codes.reset}  ${s.padEnd(w - 5)}${codes.blue}║${codes.reset}`;
  console.log(`\n${top}`);
  console.log(pad(bold(title)));
  if (subtitle) console.log(pad(dim(subtitle)));
  console.log(`${bot}\n`);
}
