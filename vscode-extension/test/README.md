# Tests

The extension has two tiers of tests.

## Unit tests (no VS Code required)

Pure-logic tests against `src/lib.ts` (search, walkthrough pairing, manifest reading, etc.). Run via Node's built-in test runner against the compiled JS.

```bash
cd vscode-extension
npm install
npm run compile
npm run test:unit
```

25 tests, ~100ms.

## Integration tests (boot real VS Code)

Boots a headless VS Code instance via [`@vscode/test-electron`](https://github.com/microsoft/vscode-test) and exercises the extension inside it — activation, command registration, configuration handling, view container registration.

```bash
cd vscode-extension
npm install
npm run test:e2e
```

First run downloads VS Code (~300MB; cached at `~/.vscode-test/`). Subsequent runs reuse the cache.

### What's covered

- Extension activates without errors.
- All 10 declared commands are registered with `vscode.commands`.
- Settings (`design-ai.path`, `design-ai.language`) are readable.
- Activity-bar view container is registered.
- Status / refreshTree / openSettings commands execute without throwing.

### What's NOT covered

- Quick-pick UI rendering (would need WebDriver or Playwright-vscode).
- File-system side effects of `install` (would need a sandbox).
- Tree provider rendering (would need to query the actual DOM).

These belong in a separate UI-test framework if/when needed.

## CI

Recommended CI matrix:

```yaml
- os: ubuntu-latest
  node: 18
- os: ubuntu-latest
  node: 20
- os: macos-latest
  node: 20
```

Linux test runs need `xvfb` to provide a headless display:

```yaml
- run: xvfb-run -a npm run test:e2e
```
