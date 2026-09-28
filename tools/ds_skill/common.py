"""Shared file, digest, and path-safety helpers for the design-system skill compiler.

Every stage reads only paths that resolve inside a declared root, hashes every
byte it reads, and writes canonical JSON so the next stage can bind to an exact
digest instead of trusting a filename.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path

SKILL_NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_FILES = 2000
MAX_FILE_BYTES = 256 * 1024

SCOPE_FILE = "scope.json"
FACTS_FILE = "facts.json"
USAGE_FILE = "usage.json"
CONTRACT_FILE = "contract.json"
VERIFY_FILE = "verify.json"
SKILL_DIR = "skill"
PROVENANCE_FILE = "provenance.json"


class CompilerError(Exception):
    """A stage refused to continue; the message names the violated rule."""


def sha256_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"


def digest_json(value: object) -> str:
    return sha256_bytes(canonical_json(value).encode("utf-8"))


def write_json(path: Path, value: object) -> str:
    """Write canonical JSON atomically and return its digest."""
    text = canonical_json(value)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    if temporary.is_symlink() or temporary.exists():
        temporary.unlink()
    temporary.write_text(text, encoding="utf-8")
    os.replace(temporary, path)
    return sha256_bytes(text.encode("utf-8"))


def read_json(path: Path, label: str) -> dict:
    if not path.is_file():
        raise CompilerError(f"{label} is missing: {path}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise CompilerError(f"{label} is not valid JSON: {error}") from error
    if not isinstance(value, dict):
        raise CompilerError(f"{label} must be a JSON object")
    return value


def expect_schema(value: dict, schema: str, label: str) -> None:
    if value.get("schema") != schema:
        raise CompilerError(f"{label} schema must be {schema!r}, found {value.get('schema')!r}")


def is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def resolve_inside(root: Path, relative: str, label: str) -> Path:
    """Resolve a declared relative path and refuse anything outside root."""
    if not isinstance(relative, str) or not relative.strip():
        raise CompilerError(f"{label} must be a non-empty relative path")
    if Path(relative).is_absolute():
        raise CompilerError(f"{label} must be relative to its root: {relative}")
    resolved = (root / relative).resolve()
    if not is_within(resolved, root):
        raise CompilerError(f"{label} escapes its root: {relative}")
    return resolved


def read_source(root: Path, path: Path, ledger: dict[str, dict]) -> str:
    """Read one UTF-8 source file inside root and record its digest in the ledger."""
    resolved = path.resolve()
    if not is_within(resolved, root):
        raise CompilerError(f"source path escapes its root: {path}")
    relative = resolved.relative_to(root).as_posix()
    data = resolved.read_bytes()
    if len(data) > MAX_FILE_BYTES:
        raise CompilerError(f"source file exceeds {MAX_FILE_BYTES} bytes: {relative}")
    if relative not in ledger and len(ledger) >= MAX_FILES:
        raise CompilerError(f"source read limit of {MAX_FILES} files reached")
    ledger[relative] = {"path": relative, "sha256": sha256_bytes(data), "bytes": len(data)}
    return data.decode("utf-8")


def walk_files(root: Path, directory: Path, suffixes: tuple[str, ...]) -> list[Path]:
    """List files by suffix under directory, skipping links that leave root."""
    found: list[Path] = []
    for current, dirnames, filenames in os.walk(directory):
        dirnames[:] = sorted(
            name for name in dirnames
            if not name.startswith(".") and name != "node_modules"
            and is_within((Path(current) / name).resolve(), root)
        )
        for name in sorted(filenames):
            candidate = Path(current) / name
            if candidate.suffix in suffixes and is_within(candidate.resolve(), root):
                found.append(candidate)
    return found


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def relative_posix(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root).as_posix()


def guard_output(path: Path, parent: Path, forbidden: list[Path]) -> Path:
    """Resolve an output path and refuse it unless it stays under parent and outside every root."""
    resolved = path.resolve()
    if not is_within(resolved, parent.resolve()) or resolved == parent.resolve():
        raise CompilerError(f"output path escapes its work directory: {path}")
    for root in forbidden:
        if is_within(resolved, root.resolve()):
            raise CompilerError(f"output path resolves inside a scoped root: {path}")
    return resolved


def scoped_roots(scope: dict) -> list[Path]:
    roots = [Path(scope["designSystem"]["root"])]
    if scope.get("consumer"):
        roots.append(Path(scope["consumer"]["root"]))
    return roots
