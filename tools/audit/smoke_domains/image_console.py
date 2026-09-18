"""Shared, local-only Image Console package and registry smoke assertions."""
from __future__ import annotations

import copy
import base64
import hashlib
import json
import os
import shutil
import signal
import socket
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[3]
PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
PNG_BYTES = base64.b64decode(PNG_BASE64)
PNG_SHA256 = f"sha256:{hashlib.sha256(PNG_BYTES).hexdigest()}"
PROMPT_GUIDE_REPOSITORY = "https://github.com/freestylefly/awesome-gpt-image-2.git"
PROMPT_GUIDE_COMMIT = "de6a8ad89b6308dc49b316fcd9f7a56bf2a73273"
REJECTION_MESSAGE = "explicit draft approval is required before provider execution"
STATIC_CONTRACT = (
    ("/", "text/html; charset=utf-8", "<title>design-ai Image Console</title>"),
    ("/index.html", "text/html; charset=utf-8", "<title>design-ai Image Console</title>"),
    ("/app.js", "text/javascript; charset=utf-8", "/api/image/compose"),
    ("/contract.js", "text/javascript; charset=utf-8", "buildGenerationRequest"),
    ("/styles.css", "text/css; charset=utf-8", ".image-console"),
    ("/website-console/styles.css", "text/css; charset=utf-8", ":focus-visible"),
)
PROVIDER_INPUT_KEYS = [
    "negativeConstraints",
    "prompt",
    "providerOptions",
    "quality",
    "referenceAssets",
    "size",
]


def _fail(message: str) -> None:
    raise SystemExit(f"Image Console smoke failed: {message}")


def _expect(condition: bool, message: str) -> None:
    if not condition:
        _fail(message)


def _assert_exact_keys(value: object, expected: list[str], label: str) -> dict:
    _expect(isinstance(value, dict), f"{label} must be an object")
    actual = list(value)
    _expect(actual == expected, f"{label} keys changed")
    return value  # type: ignore[return-value]


def assert_image_console_contract(evidence: dict, *, context: str = "Image Console") -> None:
    """Validate only bounded, redacted evidence from a local Image Console run."""
    expected_keys = [
        "static", "health", "catalog", "draft", "providerBeforeApproval",
        "rejection", "job", "assetManifest", "providerAudit", "process", "privacy",
    ]
    _expect(list(evidence) == expected_keys, f"{context}: evidence keys changed")
    static = evidence["static"]
    _expect(isinstance(static, list) and len(static) == len(STATIC_CONTRACT), f"{context}: static asset count changed")
    for actual, (path, content_type, _marker) in zip(static, STATIC_CONTRACT):
        _assert_exact_keys(actual, ["path", "contentType", "bytes", "markerFound"], f"{context}: static asset")
        _expect(actual["path"] == path and actual["contentType"] == content_type, f"{context}: static asset metadata changed")
        _expect(isinstance(actual["bytes"], int) and actual["bytes"] > 0 and actual["markerFound"] is True, f"{context}: static asset is not bounded and present")

    _assert_exact_keys(evidence["health"], ["ok", "bind"], f"{context}: health")
    _expect(evidence["health"] == {"ok": True, "bind": "loopback"}, f"{context}: health contract changed")
    _assert_exact_keys(evidence["catalog"], ["templateCount", "catalogVersion", "responseVersion", "sourceRepository", "upstreamCommit"], f"{context}: catalog")
    _expect(evidence["catalog"] == {
        "templateCount": 2,
        "catalogVersion": "mock-v1",
        "responseVersion": "v1",
        "sourceRepository": PROMPT_GUIDE_REPOSITORY,
        "upstreamCommit": PROMPT_GUIDE_COMMIT,
    }, f"{context}: catalog contract changed")

    draft = evidence["draft"]
    _assert_exact_keys(draft, ["taskType", "executable", "validationValid", "recommendationTemplate", "recommendationVersion", "catalogVersion", "responseVersion", "outputSize", "outputQuality", "compiledPromptLength", "promptBlocksExposed"], f"{context}: draft")
    _expect(draft["taskType"] == "generation" and draft["executable"] is True and draft["validationValid"] is True, f"{context}: draft is not executable and valid")
    _expect(draft["recommendationTemplate"] == "synthetic-generation" and draft["recommendationVersion"] == "1", f"{context}: recommendation drifted")
    _expect(draft["catalogVersion"] == "mock-v1" and draft["responseVersion"] == "v1", f"{context}: draft lineage drifted")
    _expect(draft["outputSize"] == "16:9" and draft["outputQuality"] == "standard", f"{context}: output settings drifted")
    _expect(isinstance(draft["compiledPromptLength"], int) and 0 < draft["compiledPromptLength"] <= 200000 and draft["promptBlocksExposed"] is False, f"{context}: draft prompt boundary changed")

    _assert_exact_keys(evidence["providerBeforeApproval"], ["invocations", "auditExists"], f"{context}: provider pre-approval")
    _expect(evidence["providerBeforeApproval"] == {"invocations": 0, "auditExists": False}, f"{context}: provider ran before approval")
    _assert_exact_keys(evidence["rejection"], ["status", "type", "message"], f"{context}: rejection")
    _expect(evidence["rejection"] == {"status": 409, "type": "ImageDraftError", "message": REJECTION_MESSAGE}, f"{context}: approval rejection changed")

    _assert_exact_keys(evidence["job"], ["status", "assetId", "draftId", "manifestPresent", "assetPathRooted", "completed"], f"{context}: job")
    _expect(evidence["job"]["status"] == "succeeded" and evidence["job"]["manifestPresent"] is True and evidence["job"]["assetPathRooted"] is True and evidence["job"]["completed"] is True, f"{context}: approved provider job did not succeed")
    _expect(isinstance(evidence["job"]["assetId"], str) and isinstance(evidence["job"]["draftId"], str), f"{context}: job identifiers are invalid")

    manifest = evidence["assetManifest"]
    _assert_exact_keys(manifest, ["keys", "mediaType", "byteSize", "sha256", "compiledPromptHash", "rawPromptFields", "rawProviderFields"], f"{context}: asset manifest")
    _expect(manifest["mediaType"] == "image/png" and isinstance(manifest["byteSize"], int) and 0 < manifest["byteSize"] <= 12 * 1024 * 1024, f"{context}: generated asset bounds changed")
    _expect(manifest["sha256"] == PNG_SHA256 and isinstance(manifest["compiledPromptHash"], str) and manifest["compiledPromptHash"].startswith("sha256:"), f"{context}: generated asset hashes changed")
    _expect(manifest["rawPromptFields"] == [] and manifest["rawProviderFields"] == [], f"{context}: raw prompt/provider fields were persisted")
    _expect("compiledPrompt" not in manifest["keys"] and "dataBase64" not in manifest["keys"], f"{context}: sensitive manifest field was persisted")

    audit = evidence["providerAudit"]
    _assert_exact_keys(audit, ["invocations", "forbiddenEnv", "inputKeys", "promptLength", "model"], f"{context}: provider audit")
    _expect(audit["invocations"] == 1 and audit["forbiddenEnv"] == [] and audit["inputKeys"] == PROVIDER_INPUT_KEYS, f"{context}: provider boundary changed")
    _expect(isinstance(audit["promptLength"], int) and 0 < audit["promptLength"] <= 200000 and audit["model"] == "synthetic-local-v1", f"{context}: provider audit contains unbounded data")
    _assert_exact_keys(evidence["process"], ["reaped"], f"{context}: process")
    _expect(evidence["process"] == {"reaped": True}, f"{context}: child process was not reaped")
    _assert_exact_keys(evidence["privacy"], ["repositoryStatusUnchanged", "externalNetwork", "secretFree", "rawResponsePersisted", "fullPromptPersisted"], f"{context}: privacy")
    _expect(evidence["privacy"] == {"repositoryStatusUnchanged": True, "externalNetwork": False, "secretFree": True, "rawResponsePersisted": False, "fullPromptPersisted": False}, f"{context}: privacy boundary changed")


def _fixture() -> dict:
    return {
        "static": [{"path": path, "contentType": content_type, "bytes": 128, "markerFound": True} for path, content_type, _marker in STATIC_CONTRACT],
        "health": {"ok": True, "bind": "loopback"},
        "catalog": {"templateCount": 2, "catalogVersion": "mock-v1", "responseVersion": "v1", "sourceRepository": PROMPT_GUIDE_REPOSITORY, "upstreamCommit": PROMPT_GUIDE_COMMIT},
        "draft": {"taskType": "generation", "executable": True, "validationValid": True, "recommendationTemplate": "synthetic-generation", "recommendationVersion": "1", "catalogVersion": "mock-v1", "responseVersion": "v1", "outputSize": "16:9", "outputQuality": "standard", "compiledPromptLength": 42, "promptBlocksExposed": False},
        "providerBeforeApproval": {"invocations": 0, "auditExists": False},
        "rejection": {"status": 409, "type": "ImageDraftError", "message": REJECTION_MESSAGE},
        "job": {"status": "succeeded", "assetId": "asset-fixture", "draftId": "draft-fixture", "manifestPresent": True, "assetPathRooted": True, "completed": True},
        "assetManifest": {"keys": ["assetId", "jobId", "taskType", "sourceAssetIds", "promptId", "selectedTemplateId", "selectedTemplateVersion", "catalogVersion", "acceptedResponseVersion", "compiledPromptHash", "provider", "model", "providerParameters", "provenance", "createdAt", "createdBy", "reviewStatus", "rightsStatus", "mediaType", "byteSize", "sha256"], "mediaType": "image/png", "byteSize": len(PNG_BYTES), "sha256": PNG_SHA256, "compiledPromptHash": "sha256:" + "0" * 64, "rawPromptFields": [], "rawProviderFields": []},
        "providerAudit": {"invocations": 1, "forbiddenEnv": [], "inputKeys": PROVIDER_INPUT_KEYS, "promptLength": 42, "model": "synthetic-local-v1"},
        "process": {"reaped": True},
        "privacy": {"repositoryStatusUnchanged": True, "externalNetwork": False, "secretFree": True, "rawResponsePersisted": False, "fullPromptPersisted": False},
    }


def _expect_fixture_failure(mutator: Callable[[dict], None], expected: str) -> None:
    value = _fixture()
    mutator(value)
    try:
        assert_image_console_contract(value, context="Image Console self-test")
    except SystemExit as error:
        _expect(expected in str(error), f"negative fixture error changed: {expected}")
    else:
        _fail(f"negative fixture unexpectedly passed: {expected}")


def run_image_console_self_test() -> None:
    assert_image_console_contract(_fixture(), context="Image Console self-test")
    _expect_fixture_failure(lambda value: value["static"].pop(0), "static asset count")
    _expect_fixture_failure(lambda value: value["static"].append(copy.deepcopy(value["static"][-1])), "static asset count")
    _expect_fixture_failure(lambda value: value["static"].reverse(), "static asset metadata changed")
    _expect_fixture_failure(lambda value: value["static"][0].update({"markerFound": False}), "static asset is not bounded")
    _expect_fixture_failure(lambda value: value["health"].update({"bind": "0.0.0.0"}), "health contract changed")
    _expect_fixture_failure(lambda value: value["catalog"].update({"responseVersion": "v2"}), "catalog contract changed")
    _expect_fixture_failure(lambda value: value["draft"].update({"promptBlocksExposed": True}), "draft prompt boundary changed")
    _expect_fixture_failure(lambda value: value["providerBeforeApproval"].update({"invocations": 1}), "provider ran before approval")
    _expect_fixture_failure(lambda value: value["rejection"].update({"status": 200}), "approval rejection changed")
    _expect_fixture_failure(lambda value: value["assetManifest"]["keys"].append("compiledPrompt"), "sensitive manifest field")
    _expect_fixture_failure(lambda value: value["providerAudit"].update({"inputKeys": ["prompt"]}), "provider boundary changed")
    _expect_fixture_failure(lambda value: value["process"].update({"reaped": False}), "child process")
    _expect_fixture_failure(lambda value: value["privacy"].update({"fullPromptPersisted": True}), "privacy boundary changed")
    print("Image Console smoke self-test passed")


def _isolated_env(root: Path, node: str, provider_script: Path, provider_audit: Path, source_env: dict[str, str]) -> dict[str, str]:
    home = root / "home"
    home.mkdir(parents=True, exist_ok=True)
    (home / ".npmrc").write_text("", encoding="utf-8")
    env = {key: source_env[key] for key in ("PATH", "LANG", "LC_ALL", "LC_CTYPE", "SystemRoot") if source_env.get(key)}
    env.update({
        "HOME": str(home),
        "TMPDIR": str(root / "tmp"),
        "TMP": str(root / "tmp"),
        "TEMP": str(root / "tmp"),
        "npm_config_cache": str(root / "npm-cache"),
        "npm_config_userconfig": str(home / ".npmrc"),
        "npm_config_update_notifier": "false",
        "npm_config_audit": "false",
        "npm_config_fund": "false",
        "NODE_ENV": "test",
        "PROMPT_GUIDE_MODE": "mock",
        "PROMPT_GUIDE_BASE_URL": "http://127.0.0.1:9",
        "PROMPT_GUIDE_EXPECTED_RESPONSE_VERSION": "v1",
        "PROMPT_GUIDE_TIMEOUT_MS": "15000",
        "IMAGE_PROVIDER_COMMAND": node,
        "IMAGE_PROVIDER_ARGS": json.dumps([str(provider_script), str(provider_audit)]),
        "IMAGE_PROVIDER_NAME": "deterministic-local",
        "IMAGE_PROVIDER_TIMEOUT_MS": "10000",
        "NO_COLOR": "1",
    })
    for key in ("tmp", "npm-cache"):
        (root / key).mkdir(parents=True, exist_ok=True)
    return env


def _write_provider(root: Path) -> tuple[Path, Path, str]:
    node = shutil.which("node")
    _expect(node is not None, "node executable is required for local provider smoke")
    provider_script = root / "provider" / "adapter.mjs"
    provider_audit = root / "provider" / "audit.json"
    provider_script.parent.mkdir(parents=True, exist_ok=True)
    provider_script.write_text(
        """import { writeFileSync } from 'node:fs';
const chunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = JSON.parse(chunks.join(''));
  const inputKeys = Object.keys(input).sort();
  const expected = ['negativeConstraints', 'prompt', 'providerOptions', 'quality', 'referenceAssets', 'size'];
  if (JSON.stringify(inputKeys) !== JSON.stringify(expected)) process.exit(17);
  const forbiddenEnv = Object.keys(process.env).filter((key) => /PROMPT_GUIDE_|API_KEY|AUTHORIZATION|TOKEN|SECRET/i.test(key));
  writeFileSync(process.argv[2], JSON.stringify({ invocations: 1, forbiddenEnv, inputKeys, promptLength: input.prompt.length, model: 'synthetic-local-v1' }) + '\\n');
  process.stdout.write(JSON.stringify({ mediaType: 'image/png', dataBase64: '""" + PNG_BASE64 + """', model: 'synthetic-local-v1' }) + '\\n');
});
""",
        encoding="utf-8",
    )
    return provider_script, provider_audit, node


def _port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _json_request(base: str, method: str, path: str, body: dict | None = None, expected_status: int = 200) -> dict:
    headers = {"Accept": "application/json", "Origin": base}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    request = Request(f"{base}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=5) as response:
            status = response.status
            raw = response.read(1024 * 1024 + 1)
    except HTTPError as error:
        status = error.code
        raw = error.read(1024 * 1024 + 1)
    except (OSError, URLError) as error:
        raise RuntimeError("local Image Console request was unavailable") from error
    _expect(len(raw) <= 1024 * 1024, "JSON response exceeded the bounded smoke limit")
    _expect(status == expected_status, f"Image Console HTTP status changed for {path}")
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RuntimeError("Image Console returned invalid JSON") from error
    _expect(isinstance(value, dict), f"Image Console JSON response changed for {path}")
    return value


def _static_request(base: str, path: str, expected_type: str, marker: str) -> dict:
    request = Request(f"{base}{path}", headers={"Accept": "*/*", "Origin": base}, method="GET")
    try:
        with urlopen(request, timeout=5) as response:
            content_type = response.headers.get("content-type", "")
            body = response.read(1024 * 1024 + 1)
    except (OSError, URLError) as error:
        raise RuntimeError("local Image Console static request was unavailable") from error
    _expect(len(body) <= 1024 * 1024, "static asset exceeded the bounded smoke limit")
    _expect(content_type == expected_type, f"static content type changed for {path}")
    _expect(marker.encode("utf-8") in body, f"packaged static marker missing for {path}")
    return {"path": path, "contentType": content_type, "bytes": len(body), "markerFound": True}


def _wait_health(process: subprocess.Popen[str], base: str) -> None:
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("Image Console server exited before health became ready")
        try:
            health = _json_request(base, "GET", "/health")
            if health.get("ok") is True:
                return
        except (RuntimeError, SystemExit, OSError):
            time.sleep(0.05)
    raise RuntimeError("Image Console health endpoint did not become ready")


def _terminate_and_reap(process: subprocess.Popen[str] | None) -> tuple[bool, str]:
    if process is None:
        return True, ""
    stdout = ""
    stderr = ""
    try:
        if process.poll() is None:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        try:
            stdout, stderr = process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            stdout, stderr = process.communicate(timeout=5)
        return process.returncode is not None, f"{stdout}\n{stderr}"
    finally:
        if process.poll() is None:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait(timeout=5)


def _repo_status() -> str:
    result = subprocess.run(["git", "status", "--short", "--untracked-files=all"], cwd=ROOT, text=True, capture_output=True, check=True)
    return result.stdout


def assert_image_console_smoke(command_factory: Callable[[int], list[str]], *, cwd: Path, env: dict[str, str], root: Path, context: str) -> None:
    """Exercise installed-bin or npm-exec Image Console behavior with no network."""
    root.mkdir(parents=True, exist_ok=True)
    before_status = _repo_status()
    provider_script, provider_audit, node = _write_provider(root)
    smoke_env = _isolated_env(root, node, provider_script, provider_audit, env)
    process: subprocess.Popen[str] | None = None
    evidence: dict | None = None
    try:
        port = _port()
        process = subprocess.Popen(command_factory(port), cwd=cwd, env=smoke_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
        base = f"http://127.0.0.1:{port}"
        _wait_health(process, base)
        static = [_static_request(base, path, content_type, marker) for path, content_type, marker in STATIC_CONTRACT]
        health = _json_request(base, "GET", "/health")
        catalog_response = _json_request(base, "GET", "/api/image/catalog")
        catalog = {key: catalog_response[key] for key in ["templateCount", "catalogVersion", "responseVersion", "sourceRepository", "upstreamCommit"]}
        request = {"taskType": "generation", "domain": "manufacturing", "outputType": "architecture", "intent": "deterministic local image", "language": "en", "audience": "operators", "aspectRatio": "16:9", "exactTexts": [], "styles": [], "scenes": [], "constraints": ["clear geometry"], "negativeConstraints": ["no gradients"], "preserve": [], "modify": [], "remove": [], "add": [], "mustNotChange": [], "referenceAssetIds": [], "metadata": {"size": "16:9", "quality": "standard"}}
        draft_response = _json_request(base, "POST", "/api/image/compose", request, 201)
        compiled = draft_response.get("compiled", {})
        recommendation = draft_response.get("recommendation", {})
        validation = draft_response.get("validation", {})
        draft = {"taskType": draft_response.get("taskType"), "executable": draft_response.get("executable"), "validationValid": validation.get("valid"), "recommendationTemplate": recommendation.get("selectedTemplateId"), "recommendationVersion": recommendation.get("selectedTemplateVersion"), "catalogVersion": compiled.get("catalogVersion"), "responseVersion": compiled.get("responseVersion"), "outputSize": draft_response.get("output", {}).get("size"), "outputQuality": draft_response.get("output", {}).get("quality"), "compiledPromptLength": len(compiled.get("compiledPrompt", "")), "promptBlocksExposed": "promptBlocks" in compiled}
        audit_exists_before = provider_audit.exists()
        rejection = _json_request(base, "POST", "/api/image/jobs", {"draftId": draft_response.get("draftId"), "approved": False}, 409)
        before_audit = {"invocations": 0, "auditExists": audit_exists_before}
        job = _json_request(base, "POST", "/api/image/jobs", {"draftId": draft_response.get("draftId"), "approved": True}, 201)
        asset = job.get("asset", {})
        manifest = job.get("manifest", {})
        asset_path = Path(asset.get("assetPath", ""))
        manifest_path = Path(asset.get("manifestPath", ""))
        asset_root = root / "home" / ".design-ai" / "image-assets"
        _expect(asset_path.is_file() and manifest_path.is_file(), "generated asset or manifest was not persisted")
        bytes_on_disk = asset_path.read_bytes()
        manifest_on_disk = json.loads(manifest_path.read_text(encoding="utf-8"))
        _expect(bytes_on_disk == PNG_BYTES and all(manifest_on_disk.get(key) == value for key, value in manifest.items()), "bounded provider asset and job manifest diverged")
        manifest = manifest_on_disk
        _expect(asset_path.resolve().is_relative_to(asset_root.resolve()), "generated asset escaped the isolated asset root")
        manifest_keys = list(manifest)
        raw_prompt_fields = [key for key in manifest_keys if key.casefold() in {"compiledprompt", "prompt", "rawresponse", "response", "database"}]
        raw_provider_fields = [key for key in manifest_keys if any(token in key.casefold() for token in ("apikey", "authorization", "token", "secret", "database", "rawresponse"))]
        provider_audit = json.loads(provider_audit.read_text(encoding="utf-8"))
        evidence = {"static": static, "health": health, "catalog": catalog, "draft": draft, "providerBeforeApproval": before_audit, "rejection": {"status": 409, "type": rejection.get("error", {}).get("type"), "message": rejection.get("error", {}).get("message")}, "job": {"status": job.get("status"), "assetId": job.get("assetId"), "draftId": job.get("draftId"), "manifestPresent": isinstance(job.get("manifest"), dict), "assetPathRooted": asset_path.resolve().is_relative_to(asset_root.resolve()), "completed": isinstance(job.get("completedAt"), str)}, "assetManifest": {"keys": manifest_keys, "mediaType": manifest.get("mediaType"), "byteSize": manifest.get("byteSize"), "sha256": manifest.get("sha256"), "compiledPromptHash": manifest.get("compiledPromptHash"), "rawPromptFields": raw_prompt_fields, "rawProviderFields": raw_provider_fields}, "providerAudit": provider_audit, "process": {"reaped": False}, "privacy": {"repositoryStatusUnchanged": False, "externalNetwork": False, "secretFree": True, "rawResponsePersisted": False, "fullPromptPersisted": False}}
        _expect(manifest.get("sha256") == PNG_SHA256 and manifest.get("byteSize") == len(PNG_BYTES), "generated asset digest changed")
    finally:
        reaped, combined_logs = _terminate_and_reap(process)
        if evidence is not None:
            evidence["process"]["reaped"] = reaped
        after_status = _repo_status()
        if evidence is not None:
            evidence["privacy"]["repositoryStatusUnchanged"] = before_status == after_status
            audit_keys = evidence["providerAudit"].keys() if isinstance(evidence["providerAudit"], dict) else ()
            manifest_keys = evidence["assetManifest"].get("keys", [])
            prompt_leak = any(token in combined_logs.casefold() for token in ("create architecture", "deterministic local image", "smoke-secret-token"))
            raw_response = any(token in audit_keys or token in manifest_keys for token in ("rawResponse", "dataBase64", "response"))
            full_prompt = "compiledPrompt" in manifest_keys or "prompt" in audit_keys or prompt_leak
            evidence["privacy"]["secretFree"] = not any(token in combined_logs.casefold() for token in ("api_key", "authorization", "smoke-secret-token", "raw provider response"))
            evidence["privacy"]["rawResponsePersisted"] = raw_response
            evidence["privacy"]["fullPromptPersisted"] = full_prompt
    if evidence is None:
        _fail(f"{context}: no smoke evidence was produced")
    assert_image_console_contract(evidence, context=context)
