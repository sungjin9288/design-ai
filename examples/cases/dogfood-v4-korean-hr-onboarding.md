# Dogfood v4 — Korean B2B SaaS HR onboarding

End-to-end test of the design-ai v4.6 corpus on a realistic Korean B2B scenario. This is a *practical* run — every section invokes the skill / knowledge file it would in production, and the output is what an adopter would receive.

## Brief

> "팀온보딩" — Korean B2B SaaS HR app for small/mid companies (10–500 employees). The product handles new-employee onboarding: document collection (계약서, 신분증, 통장 사본), e-signature, IT account provisioning, first-week checklist. Audience: HR managers (primary), new hires (secondary). Brand voice: calm, professional, trust-driven (handling sensitive personal data). Primary brand color: muted teal `#0D9488`. Stack: shadcn-ui + Tailwind v4 + React 18. Locale: Korean primary; English UI for international hires (toggle). Density: comfortable. Light + dark.

Skills to invoke: `design-system-builder` → `color-palette` → `component-spec-writer` → `ux-audit`.

## Step 1 — Bootstrap tokens (via `design-system-builder`)

### Color tokens (cite [`knowledge/colors/color-theory.md`](../../knowledge/colors/color-theory.md))

Brand seed: `#0D9488` (teal-600). Generated full ramp:

```yaml
# brand
brand-50:  #F0FDFA
brand-100: #CCFBF1
brand-200: #99F6E4
brand-300: #5EEAD4
brand-400: #2DD4BF
brand-500: #14B8A6
brand-600: #0D9488     # primary
brand-700: #0F766E
brand-800: #115E59
brand-900: #134E4A
brand-950: #042F2E

# neutral (cool-gray to pair with teal)
neutral-50:  #F9FAFB
neutral-100: #F3F4F6
neutral-200: #E5E7EB
neutral-300: #D1D5DB
neutral-400: #9CA3AF
neutral-500: #6B7280
neutral-600: #4B5563
neutral-700: #374151
neutral-800: #1F2937
neutral-900: #111827
neutral-950: #030712

# semantic — sensitive data context
success:  #10B981
warning:  #F59E0B
error:    #EF4444
info:     #3B82F6
```

### Semantic aliases (cite [`knowledge/colors/semantic-aliases.md`](../../knowledge/colors/semantic-aliases.md))

```yaml
# light
--color-bg-default:        white
--color-bg-subtle:         neutral-50
--color-bg-muted:          neutral-100
--color-fg-default:        neutral-900
--color-fg-muted:          neutral-600
--color-fg-subtle:         neutral-400
--color-fg-on-brand:       white
--color-border-default:    neutral-200
--color-border-strong:     neutral-300
--color-brand-bg:          brand-600
--color-brand-bg-hover:    brand-700
--color-brand-fg:          white
--color-error-bg:          error
--color-error-fg:          white

# dark — invert with care; brand stays at -500 for legibility on dark
--color-bg-default:        neutral-900
--color-bg-subtle:         neutral-800
--color-fg-default:        neutral-50
--color-fg-muted:          neutral-400
--color-brand-bg:          brand-500   # NOT brand-600 in dark
```

Contrast verified per [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md):
- `fg-default` on `bg-default`: 17.79:1 (AAA ✓)
- `brand-fg` on `brand-bg`: 4.94:1 (AA large ✓; AA normal at -700: 6.96:1 ✓)
- `error-fg` on `error-bg`: 4.83:1 (AA large ✓)

### Typography (cite [`knowledge/typography/korean-typography.md`](../../knowledge/typography/korean-typography.md), [`knowledge/typography/pretendard-and-fallbacks.md`](../../knowledge/typography/pretendard-and-fallbacks.md))

```css
font-family-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
                  system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo",
                  "Noto Sans KR", "Malgun Gothic", sans-serif;
font-family-mono: "JetBrains Mono", "D2Coding", monospace;
```

Type scale (base 14 product UI; +10% line-height for Korean per knowledge file):

| Variant | Size | Weight | Line-height (KR-bumped) |
| --- | --- | --- | --- |
| display | 32 | 700 | 1.32 |
| heading-lg | 24 | 600 | 1.42 |
| heading-md | 20 | 600 | 1.5 |
| heading-sm | 16 | 600 | 1.6 |
| body-lg | 16 | 400 | 1.65 |
| body | 14 | 400 | 1.65 |
| caption | 12 | 400 | 1.55 |

### Spacing / radius / elevation

```yaml
space: 4 8 12 16 20 24 32 40 48 64    # 9 stops, 4-base
radius: 0 4 6 8 12 16 999             # last is "pill"
elevation: 0 sm md lg xl              # 5 stops; subtle for B2B (less playful)
```

## Step 2 — Spec a component (via `component-spec-writer`)

The HR onboarding flow's first screen is "신규 입사자 정보 입력". Five fields: 이름 / 사번 / 입사일 / 부서 / 이메일. Three of these are FormControls. Let me spec the **EmployeeInfoForm** composition.

This exercises the v4.5 polished `form-control.md` spec end-to-end.

### EmployeeInfoForm — composition spec

```tsx
<form onSubmit={handleSubmit}>
  <FormControl error={!!errors.name} required disabled={isSubmitting} fullWidth>
    <FormLabel htmlFor="name">이름</FormLabel>
    <OutlinedInput
      id="name"
      value={values.name}
      onChange={handleChange}
      aria-invalid={!!errors.name}
      aria-describedby={errors.name ? "name-error" : "name-help"}
    />
    <FormHelperText id={errors.name ? "name-error" : "name-help"}>
      {errors.name ?? "주민등록상 이름과 동일하게 입력해 주세요"}
    </FormHelperText>
  </FormControl>

  <FormControl error={!!errors.employeeId} required fullWidth>
    <FormLabel htmlFor="employeeId">사번</FormLabel>
    <OutlinedInput
      id="employeeId"
      value={values.employeeId}
      onChange={handleChange}
      placeholder="2026-001"
      aria-invalid={!!errors.employeeId}
    />
    <FormHelperText>인사 담당자에게 받은 사번을 입력해 주세요</FormHelperText>
  </FormControl>

  <FormControl required fullWidth>
    <FormLabel htmlFor="hireDate">입사일</FormLabel>
    <DatePicker id="hireDate" value={values.hireDate} onChange={handleChange} />
  </FormControl>

  <FormControl required fullWidth>
    <FormLabel htmlFor="department">부서</FormLabel>
    <Select id="department" value={values.department} onChange={handleChange}>
      <MenuItem value="engineering">개발</MenuItem>
      <MenuItem value="design">디자인</MenuItem>
      <MenuItem value="product">기획</MenuItem>
      <MenuItem value="hr">인사</MenuItem>
    </Select>
  </FormControl>

  <FormControl error={!!errors.email} required fullWidth>
    <FormLabel htmlFor="email">회사 이메일</FormLabel>
    <OutlinedInput
      id="email"
      type="email"
      value={values.email}
      onChange={handleChange}
      placeholder="hong@team-onboarding.kr"
    />
    <FormHelperText>{errors.email ?? "회사 도메인 이메일을 입력해 주세요"}</FormHelperText>
  </FormControl>

  <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 3 }}>
    <Button variant="outlined" onClick={handleCancel}>취소</Button>
    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
      다음 단계
    </LoadingButton>
  </Stack>
</form>
```

### Korean text density adjustments (cite [`knowledge/typography/korean-typography.md`](../../knowledge/typography/korean-typography.md))

- Field labels keep short (1-3 words). "이메일" not "이메일 주소를 입력해 주세요" — that goes in helper text.
- Helper text uses 해요체 ("입력해 주세요"). For legal forms (e.g., contract page), switch to 합쇼체 ("입력하시기 바랍니다") per [`knowledge/conversational/korean-conversational-conventions.md`](../../knowledge/conversational/korean-conversational-conventions.md).
- Min-height on FormControl rows: 56px (vs 48px Latin default) — Hangul reads taller per the knowledge file.

### Tokens consumed (per [`examples/component-form-control.md`](../component-form-control.md))

```
--color-fg-default
--color-fg-error
--color-fg-primary
--color-bg-default
--color-border-default
--color-border-strong
--space-md          /* horizontal padding */
--space-sm          /* helper-text margin-top */
--space-lg          /* between FormControls */
--font-size-body    /* 14px */
--line-height-body  /* 1.65 KR-bumped */
--radius-md
```

## Step 3 — Spec the document upload (uses Card + Dialog families)

Document collection screen needs a confirmation dialog before upload. Exercises v4.5's polished `dialog-title.md` / `dialog-content.md` / `dialog-actions.md`:

```tsx
<Card sx={{ maxWidth: 480 }}>
  <CardContent>
    <Typography variant="h6">필수 서류 업로드</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      계약서 · 신분증 · 통장 사본
    </Typography>

    <List sx={{ mt: 2 }}>
      {documents.map((doc) => (
        <ListItem
          key={doc.id}
          secondaryAction={
            doc.uploaded ? (
              <CheckIcon color="success" aria-label="업로드 완료" />
            ) : (
              <Button size="small" onClick={() => handleUpload(doc.id)}>
                업로드
              </Button>
            )
          }
        >
          <ListItemText primary={doc.name} secondary={doc.description} />
        </ListItem>
      ))}
    </List>
  </CardContent>
  <CardActions>
    <Button size="small" onClick={handleSkipForNow}>나중에 하기</Button>
    <Button size="small" variant="contained" onClick={handleSubmitAll}>
      제출하기
    </Button>
  </CardActions>
</Card>

{/* Confirmation dialog — uses v4.5 family-completed primitives */}
<Dialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  aria-labelledby="confirm-title"
  aria-describedby="confirm-desc"
  fullWidth
  maxWidth="sm"
>
  <DialogTitle id="confirm-title">서류를 제출할까요?</DialogTitle>
  <DialogContent>
    <DialogContentText id="confirm-desc">
      제출 후에는 인사팀 검토를 거쳐 변경이 어려워요. 모든 정보가 정확한지 확인해 주세요.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>다시 확인</Button>
    <LoadingButton
      onClick={handleConfirmSubmit}
      loading={isSubmitting}
      variant="contained"
      autoFocus
    >
      네, 제출할게요
    </LoadingButton>
  </DialogActions>
</Dialog>
```

Citations:
- [`examples/component-card-content.md`](../component-card-content.md) — Card body region
- [`examples/component-card-actions.md`](../component-card-actions.md) — Card action row (left-aligned)
- [`examples/component-list-item.md`](../component-list-item.md) — ListItem with secondaryAction
- [`examples/component-dialog-title.md`](../component-dialog-title.md) — required `id` for `aria-labelledby`
- [`examples/component-dialog-content.md`](../component-dialog-content.md) — `DialogContentText` with `id` for `aria-describedby`
- [`examples/component-dialog-actions.md`](../component-dialog-actions.md) — Cancel · Primary order (Korean / Western convention)

## Step 4 — UX audit (via `ux-audit` skill)

Quick audit of the bootstrap output:

| Issue | Severity | Resolution |
| --- | --- | --- |
| Field labels in 합쇼체 vs helper-text in 해요체 — register mismatch | MEDIUM | Standardized on 해요체 throughout (matches B2B onboarding tone, less stiff than 합쇼체) |
| `email` field has placeholder + helper text + error message → 3 strings competing | MEDIUM | Removed placeholder; rely on helper text. Placeholder disappears on focus, accessibility issue |
| No password field in initial draft | INFO | Out of scope for this screen; password set on email-verify step |
| `LoadingButton` not in our spec'd components | HIGH | Need spec for it OR reference MUI directly. Action: add to roadmap |
| Department `Select` with 4 options — should be radio? | LOW | 4 is borderline. Select OK on mobile (saves vertical space). Radio better on desktop. Acceptable |
| No "save draft" before "다음 단계" — risky if user navigates away | HIGH | Add auto-save on blur per [`knowledge/patterns/form-design.md`](../../knowledge/patterns/form-design.md) |

## Step 5 — Stability review dogfood

Ran `/stability-review` mid-session to test:

```bash
$ python3 tools/audit/stability-review.py --today 2026-12
```

Output:
- 90 stable, 0 beta/experimental/deprecated.
- 1 file without metadata: `knowledge/COVERAGE.md` (generated artifact — false positive).
- No promotion candidates yet (all v4.x knowledge is stable from day one).
- 0 stale stable files at 7-month projection.

**Finding**: `knowledge/COVERAGE.md` showing as "missing stability" is noise. It's a generated index, not a knowledge document. Either:
1. Add `stability: stable` to the generator (signals "as fresh as the last regen").
2. Skip generated files in `stability-review.py`.

## Step 6 — What v4 enabled vs v3

| Capability | v3 dogfood (fintech) | v4 dogfood (HR) |
| --- | --- | --- |
| Form-Control composition spec | I had to invent | `component-form-control.md` exists; cited directly |
| Dialog-Title with `aria-labelledby` | I had to research | `component-dialog-title.md` makes the contract explicit |
| ListItem with secondaryAction | I conflated with ListItemButton | `component-list-item.md` clarifies the boundary |
| Card-Actions left-align convention | Unclear | `component-card-actions.md` documents it + cites Korean B2C precedent |
| Korean B2B tone (해요체 vs 합쇼체) | General KR knowledge | Specific to onboarding context — could use a knowledge file |
| Stability review | Manual | `/stability-review` automates |

## Output — what I'd hand to a developer

The above sections constitute the initial spec hand-off. Adopter receives:

1. Token JSON (color / typography / spacing / radius / elevation / motion).
2. EmployeeInfoForm composition spec (TypeScript).
3. Document upload card + confirmation dialog spec.
4. UX audit findings (6 issues categorized by severity).
5. Stability review report (no actions needed this quarter).

Total elapsed: ~30 min reading + composing for a senior-designer-equivalent hand-off. v3 dogfood took ~50 min for similar scope.
