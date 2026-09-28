"""Stage 1: persist the scope decision before any design-system source is read.

The scope names one design-system root, its public entry, the directories each
fact family may come from, an optional consuming repository, and the output
directory. Only directory existence is checked here; file contents are not read.
"""
from __future__ import annotations

from pathlib import Path

from common import (
    MAX_FILE_BYTES,
    MAX_FILES,
    SCOPE_FILE,
    SKILL_NAME_PATTERN,
    CompilerError,
    expect_schema,
    is_within,
    read_json,
    resolve_inside,
    write_json,
)

SCOPE_SCHEMA = "design-ai.ds-skill.scope/v1"
BOUNDARY = (
    "Read-only: the compiler never writes inside the design-system or consumer root.",
    "No dependency install, Figma write, commit, push, or publish is performed.",
    "Installing the generated skill into a consumer repository requires the existing scope approval chain.",
)


def _require_directory(root: Path, relative: str, label: str) -> str:
    resolved = resolve_inside(root, relative, label)
    if not resolved.is_dir():
        raise CompilerError(f"{label} is not a directory: {relative}")
    return resolved.relative_to(root).as_posix() or "."


def _require_root(value: str, label: str) -> Path:
    root = Path(value).expanduser().resolve()
    if not root.is_dir():
        raise CompilerError(f"{label} is not a directory: {value}")
    return root


def _directories(root: Path, values: list[str], label: str) -> list[str]:
    return sorted({_require_directory(root, value, label) for value in values})


def build_scope(args) -> dict:
    """Validate declared paths and return the scope record without reading sources."""
    if not SKILL_NAME_PATTERN.fullmatch(args.name or "") or len(args.name) > 64:
        raise CompilerError("skill name must be <=64 lowercase alphanumeric/hyphen characters")
    ds_root = _require_root(args.ds_root, "design-system root")
    entry = resolve_inside(ds_root, args.entry, "entry")
    if not entry.is_file():
        raise CompilerError(f"entry is not a file: {args.entry}")
    if not (ds_root / "package.json").is_file():
        raise CompilerError("design-system root must contain package.json")
    consumer = _consumer_scope(args, ds_root)
    out = Path(args.out).expanduser().resolve()
    for root, label in ((ds_root, "design-system root"), (Path(consumer["root"]) if consumer else None, "consumer root")):
        if root is not None and (is_within(out, root) or is_within(root, out)):
            raise CompilerError(f"output directory must be outside the {label}")
    return {
        "schema": SCOPE_SCHEMA,
        "skillName": args.name,
        "designSystem": {
            "root": str(ds_root),
            "entry": entry.relative_to(ds_root).as_posix(),
            "components": _directories(ds_root, args.components, "components directory"),
            "tokens": _directories(ds_root, args.tokens or [], "tokens directory"),
            "icons": _directories(ds_root, args.icons or [], "icons directory"),
        },
        "consumer": consumer,
        "limits": {"maxFiles": MAX_FILES, "maxFileBytes": MAX_FILE_BYTES},
        "boundary": list(BOUNDARY),
    }


def _consumer_scope(args, ds_root: Path) -> dict | None:
    if not args.consumer:
        if args.consumer_src:
            raise CompilerError("--consumer-src requires --consumer")
        return None
    consumer_root = _require_root(args.consumer, "consumer root")
    if is_within(consumer_root, ds_root) or is_within(ds_root, consumer_root):
        raise CompilerError("consumer root and design-system root must not contain each other")
    sources = args.consumer_src or ["."]
    return {"root": str(consumer_root), "sources": _directories(consumer_root, sources, "consumer source directory")}


def write_scope(args) -> Path:
    scope = build_scope(args)
    out = Path(args.out).expanduser().resolve()
    target = out / SCOPE_FILE
    if target.exists() and not args.replace:
        raise CompilerError(f"scope already exists; pass --replace to supersede it: {target}")
    write_json(target, scope)
    return target


def load_scope(work: Path) -> dict:
    """Load a persisted scope and re-check every boundary it declares."""
    scope = read_json(work / SCOPE_FILE, "scope")
    expect_schema(scope, SCOPE_SCHEMA, "scope")
    name = scope.get("skillName")
    if not isinstance(name, str) or len(name) > 64 or not SKILL_NAME_PATTERN.fullmatch(name):
        raise CompilerError("scope skill name must be <=64 lowercase alphanumeric/hyphen characters")
    ds = scope.get("designSystem") or {}
    ds_root = Path(ds.get("root", "")).resolve()
    if not ds_root.is_dir():
        raise CompilerError(f"scope design-system root no longer exists: {ds_root}")
    if is_within(work.resolve(), ds_root):
        raise CompilerError("work directory must be outside the design-system root")
    resolve_inside(ds_root, ds.get("entry", ""), "entry")
    for key in ("components", "tokens", "icons"):
        for relative in ds.get(key, []):
            resolve_inside(ds_root, relative, f"{key} directory")
    consumer = scope.get("consumer")
    if consumer:
        consumer_root = Path(consumer.get("root", "")).resolve()
        if is_within(work.resolve(), consumer_root):
            raise CompilerError("work directory must be outside the consumer root")
        for relative in consumer.get("sources", []):
            resolve_inside(consumer_root, relative, "consumer source directory")
    return scope
