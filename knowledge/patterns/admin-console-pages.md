<!-- hand-written -->
---
title: Admin console pages
applies_to: [admin, erp, b2b-saas, internal-tools]
version: 1.0.0
last_updated: 2026-10
stability: stable
---

# Admin console pages

An admin console (back office, ERP, internal tool) is built from a small set of page types: list, detail, form, result, exception, workbench, settings. The work is choosing the right type for each task and holding the frame (navigation, page header, footer toolbar) the same everywhere. This note is the page-type catalog plus the console frame. Dashboards, settings, forms, lists, empty, error and search states have their own notes and are linked rather than repeated.

**Sources.** Pattern guidance comes from the Ant Design spec docs under `refs/ant-design/docs/spec/` (the `research-*` files belong to Ant's exploratory "Design Patterns (Research)" channel, which Ant describes as work in progress, see `research-overview.en-US.md`). Page anatomy comes from the reference app `ant-design/ant-design-pro` at commit `ecee481b` (package version 6.0.3). That app is built on ProComponents v3. On 2026-10-20 the npm `latest` tag for `@ant-design/pro-components` was 2.8.10 and v3 shipped only under `beta` (3.1.15-7). This note therefore describes **what is on the page**, never ProComponents props. When you build these pages, use the antd components cited here, or ProComponents 2.x after checking its own docs.

## Page-type catalog

| Page type | Purpose | Anatomy | Key states | When not to use | Pro example route |
| --- | --- | --- | --- | --- | --- |
| **Workbench** | Home hub for returning users: to-dos, shortcuts, key numbers | Greeting header + personal stats, 5–9 modules, most-used module on the first screen | New user (guide variant), empty modules, partial load | The user's job is analysis → use an analysis dashboard | `/dashboard/workplace` |
| **Analysis / monitor dashboard** | Decisions from aggregated metrics | KPI row → main chart → secondary charts → detail table | Loading, stale data, empty, error | Operating on individual records → use a query table | `/dashboard/analysis`, `/dashboard/monitor` |
| **Query table** | Find and act on records when you know the field values to search by | Query form → table toolbar → selectable table → pagination → bulk bar | Filtered-empty, no-data, loading, partial selection | Vague targets across many content types → use a search list | `/list/table-list` |
| **Standard list** | Overview of entries plus progress numbers ("light workbench") | Stat strip → card with segmented filter + search → list rows with actions → add-new button | Empty, filtered-empty | Many fields per entry → use a query table | `/list/basic-list` |
| **Card list** | Equal-weight showcase of entries with no browse order | Grid of cards, add-new card | Empty | Users compare fields across entries | `/list/card-list` |
| **Search list** | Keyword search across content types | Large centered search → tabs per content type → facet rows → results → load more | No results, facet-empty | You know the field values to query → use a query table | `/list/search/*` |
| **Member management** | Members of an object and their roles and permissions | Member table + add, remove, assign-role actions | Last-owner guard, pending invite | (not in Pro) | — |
| **Basic detail** | Read one simple record | One card, description groups split by dividers, line-item table with total | Missing fields, empty sub-table | Large content or loosely related topics → advanced detail | `/profile/basic` |
| **Advanced / document detail** | Complex record, approval document | Header with identifier, actions, summary, status stats, tabs → progress steps → info cards → logs | Pending, rejected, read-only, no permission for an action | Simple records (it adds structure for nothing) | `/profile/advanced` |
| **Basic form** | Quick create or edit with few fields | Single column, max-width form in one card | Validation, submitting, server error | More than ~2 screens of fields | `/form/basic-form` |
| **Step form** | Linear task that must be confirmed before it commits | Steps bar → step forms → confirm step → result step | Back without data loss, confirm, irreversible warning | Steps that are arbitrary chunks of fields | `/form/step-form` |
| **Advanced (long) form** | Bulk one-shot entry of many grouped fields | Titled cards per group, editable table for repeated rows, sticky footer toolbar with error summary | Error count, dirty, submitting | Fewer than ~2 screens of fields → basic form | `/form/advanced-form` |
| **Result (success / fail)** | Strong feedback when a heavy flow ends | Status icon, title, explanation, ≤2 actions, optional detail block | Auto-redirect countdown, partial failure | Light feedback → message or notification | `/result/success`, `/result/fail` |
| **Exception (403 / 404 / 500)** | Explain a page-level failure and give a way out | Illustration, code, description, suggested action | — | Module-level load failure → inline retry | `/exception/403`, `/exception/404`, `/exception/500` |
| **Account center / settings** | Personal profile, security, bindings, notifications | Left section menu + one section panel | Saved, unsaved, verification required | Org-wide configuration (needs its own IA) | `/account/center`, `/account/settings` |

The "Key states" and "When not to use" columns are judgment, not sourced, except where a sourced section below names the state. Sources: list types `research-list.en-US.md`, `data-list.en-US.md`; forms `research-form.en-US.md`; detail `detail-page.en-US.md`; result `research-result.en-US.md`; exception `research-exception.en-US.md`; workbench `research-workbench.en-US.md`; dashboards `visualization-page.en-US.md`; routes `config/routes.ts` at `ecee481b`. Member management exists only as a spec template. Pro has no page for it.

**Pick the page type before the layout.** Ant's list and detail docs both choose a template from two inputs: how complex the information is and how closely the parts relate. Low complexity → one flat card. High complexity with loosely related parts → split it into cards, tabs or steps (`detail-page.en-US.md`, `research-form.en-US.md` "Determine Layout Method").

## Console frame and navigation

### Side, top or mix

| Frame | Use when | Source |
| --- | --- | --- |
| **Side nav** | More than 6 menu items, 1–3 levels. Ant recommends it for enterprise products because it is easy to scan and item order matters less | `research-navigation.en-US.md` |
| **Top nav** | 2–7 first-level items, 1–2 levels. Order drives usage. Labels under ~15 characters | `research-navigation.en-US.md`, `navigation.en-US.md` |
| **Mix (top bar + side menu)** | Top bar carries logo, product or tenant switch and utility tools. Side menu carries the module tree. This is the Pro default. The split of roles between bar and menu is judgment, not sourced | `config/defaultSettings.ts` at `ecee481b` |
| **Immersive / subsite** | Editors and other deep, workspace-heavy tasks. Hide global nav and keep only an exit to the parent or home. Make the change of space visually obvious | `research-navigation.en-US.md` "Subsite Navigation" |

Default for a Korean or B2B console: **mix**, side menu always visible, 2 levels deep, 3 at most. A hamburger-hidden menu is the wrong pattern here (`../i18n/korean-density-conventions.md`, "Lists, trees, and navigation").

### Frame dimensions

- Top nav: first level 64px tall, second level 48px. Heights follow `48 + 8n`. Side nav widths follow `200 + 8n` (`refs/ant-design/components/layout/index.en-US.md`, "Size"). The antd `Layout.Sider` documents a 200px default width and an 80px collapsed width in the same file.
- Design board: Ant designs at 1440 wide and names 1920, 1440, 1366 and 1280 as the screen widths to cover (`layout.en-US.md`). Verify every console page at 1280. It is where tables start to scroll sideways (judgment, not sourced).
- Left-right layout: the side nav stays fixed and the work area scales (`layout.en-US.md`). Pro ships a **fixed sider**, a **non-fixed header** and **fluid content width** (`config/defaultSettings.ts`).
- Content width: keep tables and dashboards fluid. Cap reading-heavy surfaces: Pro's basic form caps itself at 600px inside a full-width card (`src/pages/form/basic-form/index.tsx`). Detail pages should keep description rows readable rather than stretching labels and values 1,600px apart (judgment, not sourced).
- Collapse the sider to icons below `lg` (992px) and make it an overlay drawer below `md` (768px). Breakpoint values come from `layout/index.en-US.md`; this collapse schedule is judgment, not sourced.

### Page header

The page header names the page's subject, holds in-page navigation, and carries page-level actions (`research-navigation.en-US.md` "Page Header"). Pro's advanced profile shows the full anatomy (`src/pages/profile/advanced/index.tsx`):

```
Breadcrumb (only at ≥3 levels)
Title: object identifier ("Order no. 2342…")        [Action 1][Action 2][More ▾] [Primary]
Summary: 2-column description list (1 column on mobile)        Status: Pending · Amount: ¥568.08
Tabs: Details | Rules
```

- **One primary action per button group** (`buttons.en-US.md`). Secondary actions sit in a group. Rare actions collapse into "More". Collapse in order of importance, with the collapsed menu on the right.
- Key status and amount go top right as statistics, not inside the description list. Users scan for them first.
- Header tabs change the whole page body. Put the tab in the URL so the view can be shared: Pro's search list routes each tab to its own subpath (`src/pages/list/search/index.tsx`; `research-navigation.en-US.md` asks for a URL marker on shareable in-page navigation).

### Breadcrumb, back and utility nav

- Skip the breadcrumb when there are fewer than 3 levels, because global nav already shows the location. Show at most 5 levels, ideally under 3 (`research-navigation.en-US.md`, `navigation.en-US.md`).
- Use a back button in the header only in subsites where global nav is hidden. Never show both a breadcrumb and a back button (`research-navigation.en-US.md` "Back Button").
- Utility nav sits top right: global search, notifications, help, language, account. **Page actions never go there** (`research-navigation.en-US.md` "Utility Navigation").
- Clicking the logo always returns home. This is the escape hatch (`research-navigation.en-US.md`, principles).

### Routing conventions from Pro

`config/routes.ts` at `ecee481b` shows four rules worth copying:

1. Auth pages (`/user/login`, `/user/register`) render **outside** the console frame. Their unknown subpaths go to a 404 that is also outside the frame.
2. Admin-only branches are gated by an access key on the route. Hide the menu items a role cannot reach, and still guard the route itself so a deep link shows 403 (judgment, not sourced).
3. Every menu group redirects its bare path to a default child (`/form` → `/form/basic-form`), so no group URL is ever empty.
4. A final catch-all route sends any unknown path to the in-frame 404.

Check the navigation with Ant's "parachute" test: open a random deep page and confirm the user can tell where they are, what the parent page is, and where each link leads (`research-navigation.en-US.md` "How to Validate").

## Query table with bulk actions

Anatomy, synthesized from Pro `src/pages/table-list/index.tsx` (query form, create button, row selection, title link to a drawer, bulk footer) and `data-list.en-US.md` ("layout", "List Toolbar"). Fields per row and the collapse control are judgment, not sourced:

```
┌ Page header ─────────────────────────────────────────────────────────┐
├ Query form: label-left fields, 3–4 per row      [Query] [Reset] [More ▾] │
├ Toolbar: table title                     [+ New]   density · columns · ⟳ │
├ ☐ │ Name (link → drawer) │ … │ Status ● │ Updated │ Actions: Edit · More │
├ Pagination: total · page size · quick jumper                           │
└ Sticky bulk bar (only while ≥1 row selected):                          │
   "3 selected · 1,240 calls"                 [Batch delete] [Batch approve]
```

- **Query, filter or search, picked on purpose.** *Query*: set several conditions, then submit once. Use it on the query table. *Filter*: results update with every change. Pro's article search re-queries on each facet change. *Search*: one keyword matched across many attributes (`data-list.en-US.md` "Search data"; `src/pages/list/search/articles/index.tsx`). The more often users search, the faster this control must be. Ask engineering what the backend can afford before you promise live filtering (`data-list.en-US.md`). Search input details: [search-ux.md](search-ux.md).
- **Selection opens the bulk bar.** Checking a row switches the list toolbar into batch mode (`data-list.en-US.md`). Page-level batch actions belong at the bottom of the page (`research-list.en-US.md`). Pro renders a sticky footer bar that shows the selected count and an aggregate of a key column.
- **State the selection scope.** "3 selected on this page" and "all 1,284 matching rows selected" are different commands. Offer the second one explicitly (judgment, not sourced).
- **Confirm destructive batches.** The spec gives three levels: delete with undo, a second confirmation, or a security check for high-risk actions (`data-list.en-US.md` "delete"). Pro's batch delete runs **without** confirmation and its single-row delete in basic list uses a confirm modal (`src/pages/list/basic-list/index.tsx`). Copy the confirm, not the unguarded batch. Name the count in the dialog ("Delete 3 rules?").
- **Opening a record.** The title cell is the link (`data-list.en-US.md`). Pick the container by how much there is to show. Expand in place when the detail is under one screen. Use a drawer when it is longer (Pro opens a 600px drawer). Use a full page when it must be shared or the task is immersive. Use two columns when users step through many items in a row.
- **New.** Put the primary "New" button top right. After creation, insert the new row first and highlight it briefly (`data-list.en-US.md` "New").
- **Pagination.** Paginate by default and hide the pager when everything fits on one page. Cache the scroll position and mark visited rows, so Back returns the user to where they were (`data-list.en-US.md`). Let users change page size on large sets. Add a quick jumper above 5 pages (`navigation.en-US.md`).
- **Row actions.** Use text buttons (`buttons.en-US.md`). Inline the 2–3 frequent actions. Only rare or destructive ones go behind "More" (judgment, reconciling `buttons.en-US.md` with the inline-actions rule in `../i18n/korean-density-conventions.md`).
- **Status is never colour alone.** Pro's status badges pair a dot with a text label (`src/pages/profile/advanced/index.tsx`).
- **Empty.** Never-had-data and no-results-for-this-filter need different copy and actions (`data-list.en-US.md`; [empty-states.md](empty-states.md)).

## Detail pages

Choose by complexity × relatedness (`detail-page.en-US.md`):

| Template | Use | Grouping |
| --- | --- | --- |
| Basic detail | Little content, low complexity | One card, groups separated by non-full-width dividers |
| Document detail | Approval documents and their actions (approve, reject, transfer, countersign, suspend, withdraw) | Cards per complex module |
| Advanced detail | Large, complex content | Header tabs + cards |
| Publish process | Development or collaboration flows | Steps |

Section order for an advanced or document detail (Pro `src/pages/profile/advanced/index.tsx`):

1. **Header**: identifier as title, action group + one primary, 2-column summary, status and amount stats, tabs.
2. **Process progress**: steps showing actor and timestamp per finished step, plus a nudge link on the current approver.
3. **Entity info**: description lists. Use an inner card when the information has several levels.
4. **Related records**: with their own empty state (Pro shows an empty card for "call records").
5. **Operation log**: card-level tabs, one table per log type, status badges with text.

Basic detail (Pro `src/pages/profile/basic/index.tsx`): one card → description groups split by dividers → line-item table with a bold **Total** summary row and right-aligned numbers → progress table. Neither table gets pagination or search.

Rules: show content flat and do not fold it unless you must. Group by proximity. Reuse the same module shapes so structure does not compete with content (`detail-page.en-US.md` principles). Use non-full-width dividers between related groups, full-width dividers between parts, cards for one topic each, and tabs for groupings like version or phase (`detail-page.en-US.md` "Separation Methods").

## Form archetypes

| Archetype | Use | Anatomy (Pro) | Source |
| --- | --- | --- | --- |
| **Basic** | Few items that do not group | Vertical labels, single column, 600px max, optional fields marked "(optional)", help tooltips on labels, a field revealed by a radio choice | `research-form.en-US.md`; `src/pages/form/basic-form/index.tsx` |
| **Step** | Linear task with a confirm step | Fill → **confirm** (irreversible-effect warning, bordered summary, password re-entry) → **done** (success result, 2 actions, summary). Help text sits under the steps | `research-form.en-US.md`; `src/pages/form/step-form/index.tsx` |
| **Grouped / advanced** | Many items in one task that can be categorized | One titled card per group, a responsive grid (3-up at lg and wider, 2-up then full width at md, 1-up at sm), an editable table for repeated rows, a **sticky footer toolbar** | `research-form.en-US.md` "Card Grouping"; `src/pages/form/advanced-form/index.tsx` |
| **Editable list** | One or more objects, each with several rows of data | Inline add/remove for ≤3 items, editable table for 2–5, collapse panels for 6–8, drawer for >8 | `research-form.en-US.md` |
| **Settings** | Rarely changed personal or app config | See [settings-page.md](settings-page.md). Fewer than 7 items: no groups. 7–15: groups. Over 15: tabs. One save mode per page | `research-form.en-US.md` "Settings" |

**Layout ladder.** Ant ranks form layouts from simple to complex, each step compatible with the one before: single column → weak grouping (short related fields share a row) → in-area groups with titles → cards (when the form runs past about two screens, with a large title per card) (`research-form.en-US.md` "Layout Methods").

**Multi-column, settled.** The sources disagree. `research-form.en-US.md` forbids multi-column fields within one area because they break reading order. Pro's advanced form uses a 3-up grid per card. `../i18n/korean-density-conventions.md` calls 2–3 columns normal for master-data screens. [form-design.md](form-design.md) defaults to a single column. Rule (judgment, not sourced): single column for **task** forms (create, apply, request). A grid for **master-data** entry by trained operators, where each row is one related set and reading runs row by row. Always one column below `md`. Never split a related pair across rows.

**Sticky footer toolbar** (long forms):

- Use it when the body is longer than one screen or has subgroups with their own actions. The footer separates "complete" from the body (`buttons.en-US.md` "When to Put Buttons in the Footer").
- Pro's toolbar holds submit plus an **error count**. Clicking the count opens a list of field errors, and each item scrolls to its field (`src/pages/form/advanced-form/index.tsx`). Copy this. Users cannot see errors three cards up.
- One primary. Order the buttons along the conversation flow, with back or cancel on the left (`buttons.en-US.md` "Ordering").
- Reserve bottom padding equal to the bar's height, so the bar never covers the last field or a focused field (judgment, not sourced; this also meets WCAG 2.2 SC 2.4.11 Focus Not Obscured).
- Guard against leaving with unsaved changes the same way the settings save bar does ([settings-page.md](settings-page.md) "Save bar").

**Copy.** Don't write placeholders that repeat the label ("Name" → "Please enter your name"). Explain unavoidable jargon with help text, not longer labels. Use one component per content type across the page (`research-form.en-US.md` "Do & Don't").

**Required marks.** Pro hides required markers and labels optional fields instead. That only works when optional fields are the minority. On Korean data-entry screens, keep the compact required marker (`../i18n/korean-density-conventions.md`, "Forms at density"; [form-design.md](form-design.md) "Required vs optional").

## Result pages

- **Use sparingly.** A result page is the heaviest form of feedback. Use it only when the user must pay attention, there is a lot to show, and the page needs to stay. Otherwise use a message, an alert or a notification (`research-result.en-US.md`; the feedback-method matrix in `research-message-and-feedback.en-US.md`).
- **Anatomy**: result feedback, optional explanation, suggested actions, optional extra information such as process progress, error details or related items (`research-result.en-US.md`). The antd `Result` component has statuses for success, error, info and warning, plus 404, 403 and 500 (`refs/ant-design/components/result/index.en-US.md`).
- **Title formula**: object + action + result, or action + result ("Purchase order submitted") (`research-result.en-US.md`).
- **At most 2 actions** (`research-result.en-US.md`). Pro's success page shows three (Back to list, View project, Print; `src/pages/result/success/index.tsx`). Demote the third to a text link (judgment, not sourced).
- **Auto-redirect on success** after 3–5 s, with the countdown shown on the primary button (`research-result.en-US.md`). Let users stop the countdown (judgment, not sourced; WCAG 2.2.1 Timing Adjustable).
- **Failure**: list each blocking problem with an inline fix link, and give one primary action, "Back to edit" (`src/pages/result/fail/index.tsx`). Field validation belongs in the form, not on the result page (`research-result.en-US.md` "Simplify Information").

## Exception pages

| Case | When | Primary action | Notes |
| --- | --- | --- | --- |
| **403** | No permission to the app or to the data | Home, plus a way to request access | Don't confirm what the hidden resource contains. Name the org or tenant the user needs ([error-states.md](error-states.md) "Permission / 403") |
| **404** | The requested page, item or resource does not exist | Home or search | Reached from the catch-all route |
| **500** | The server cannot serve the request | **Retry**, plus support details | Pro's 500 offers only "Back Home" (`src/pages/exception/500/index.tsx`). Add retry and a copyable request ID ([error-states.md](error-states.md) "Error code visibility") |
| **Browser unsupported** | The page cannot run in this browser | Upgrade link | If the impact is minor, use a global banner and let users continue (`research-exception.en-US.md`) |
| **Load failure** | One module failed to load | Inline retry in that module | Not a full-page exception (`research-exception.en-US.md`) |

- **Anatomy**: illustration, HTTP code, a short cause (so users can report it), and a suggested action (`research-exception.en-US.md`). Ant shows the code, while [error-states.md](error-states.md) puts plain language first. In consoles, make the plain-language description primary and the code a secondary label. Admins quote codes to support (judgment, reconciling both).
- **Keep authenticated exceptions inside the frame.** Pro renders 403, 404 and 500 inside the console layout as a borderless card, so the nav stays as a way out. Only the logged-out 404 renders bare (`config/routes.ts`, `src/pages/exception/*`).
- **Design all five page states**: ideal, partial (some modules empty), loading (spinner or skeleton), error (system or permission), empty (`research-exception.en-US.md` "Design Recommendations"). Empty copy: [empty-states.md](empty-states.md).

## Workbench

- Use it as the app's home for returning users. Keep 5–9 modules, put the most used on the first screen, order by daily frequency, and offer role-based views. Typical modules: help, core data, shortcuts, to-dos, focus items, operational modules (product news and promotions) (`research-workbench.en-US.md`).
- Offer two kinds of navigation: direct ("I know the function") and discovery ("I know the task, not the function") (`research-workbench.en-US.md`).
- Pro anatomy (`src/pages/dashboard/workplace/index.tsx`): header greeting with avatar, title and org path. Three personal stats top right. A 16/8 column split at `xl` that stacks below it. Left column: in-progress projects grid, then activity feed. Right column: editable quick links, an index chart, the team.
- New users get the guide variant: what the platform is for, how to start, a demo entry for complex objects (`research-workbench.en-US.md`; [empty-states.md](empty-states.md)).
- Analytical and monitoring dashboards: [dashboard-composition.md](dashboard-composition.md). Summary first, filters next, details on demand, 5–9 modules (`visualization-page.en-US.md`).

## Density and Korean enterprise notes

The baseline is in [korean-density-conventions.md](../i18n/korean-density-conventions.md). Admin-specific deltas:

- **Cozy rows are the default** for query tables. Offer a compact toggle on high-row screens and save the choice per user.
- **Label-left query forms and master-data forms**, not Pro's vertical labels. Vertical labels are fine for basic and step forms.
- **Freeze the identity column** (전표번호, 사번, 거래처) and the header. Keep totals in a summary row, the way Pro's basic detail does with its bold total.
- **Units**: Pro's bulk bar uses the Chinese 万 unit. Korean consoles use 만/억 or full digits with separators, and stay consistent ([money-and-amount.md](money-and-amount.md)).
- **Labels** (judgment, not sourced): **조회** for submitting a query form and **검색** for keyword search. Use **초기화** for reset, **신규 등록** for create, **일괄 삭제·일괄 승인** for batch actions, and **선택 3건** for the selection count.

## Accessibility and responsive notes

- Landmarks: side menu `nav`, header `banner`, work area `main`. The bulk bar and footer toolbar sit in reading order after the content they act on (judgment, not sourced).
- Announce selection-count changes and the result countdown through a polite live region (judgment, not sourced).
- Text and badges meet 4.5:1 on their surface, and hairlines hold up at density ([contrast.md](../a11y/contrast.md)). Focus rings are never clipped by dense rows or the sticky bar ([keyboard-and-focus.md](../a11y/keyboard-and-focus.md)).
- Touch or hybrid consoles: keep a ≥44×44 hit area even on compact rows ([korean-density-conventions.md](../i18n/korean-density-conventions.md)).
- Responsive: the sider collapses, form grids drop to one column below `md`, and Pro's settings menu switches from vertical to horizontal on narrow viewports (under 768px, `src/pages/account/settings/index.tsx`). Wide tables scroll sideways with the identity column frozen rather than reflowing into cards.

## Pre-ship checklist

- [ ] Every page maps to one catalog type, and the type matches the task (query vs search vs list).
- [ ] The side menu is visible at desktop widths, at most 3 levels, and the active item is highlighted at every level.
- [ ] Breadcrumb appears only at ≥3 levels, never next to a header back button.
- [ ] The page header has one primary action. Rare actions are in "More". Status and amount appear as header stats.
- [ ] Shareable tabs and filters are reflected in the URL.
- [ ] The query form has Query and Reset. Filters live-update only where the backend can afford it.
- [ ] Bulk bar: appears on selection, shows count and scope, destructive actions confirm and name the count.
- [ ] Pagination keeps position and visited rows on Back. The pager is hidden when everything fits on one page.
- [ ] Detail pages show content flat. Long ones use cards or tabs with a fixed section order.
- [ ] Long forms have a sticky footer with an error summary that jumps to each field. The bar never covers the focused field.
- [ ] The step form confirms irreversible effects before commit and returns a result step.
- [ ] Result pages have ≤2 actions and a stoppable auto-redirect. Validation errors stay in the form.
- [ ] 403 offers access request, 500 offers retry plus a request ID. Both render inside the frame.
- [ ] All five page states are designed for each module: ideal, partial, loading, error, empty.
- [ ] Korean density: cozy rows, label-left data-entry forms, frozen identity column, totals row, consistent 만/억 units.
- [ ] Verified at 1280 and 1920 wide, keyboard-only, and with a screen reader on the bulk bar and dialogs.

## Sources

Ant Design spec (local clone, read-only):

- `refs/ant-design/docs/spec/research-overview.en-US.md` (research channel status)
- `refs/ant-design/docs/spec/research-list.en-US.md`
- `refs/ant-design/docs/spec/research-form.en-US.md`
- `refs/ant-design/docs/spec/research-navigation.en-US.md`
- `refs/ant-design/docs/spec/research-result.en-US.md`
- `refs/ant-design/docs/spec/research-exception.en-US.md`
- `refs/ant-design/docs/spec/research-empty.en-US.md`
- `refs/ant-design/docs/spec/research-message-and-feedback.en-US.md`
- `refs/ant-design/docs/spec/research-workbench.en-US.md`
- `refs/ant-design/docs/spec/detail-page.en-US.md`
- `refs/ant-design/docs/spec/data-list.en-US.md`
- `refs/ant-design/docs/spec/visualization-page.en-US.md`
- `refs/ant-design/docs/spec/navigation.en-US.md`
- `refs/ant-design/docs/spec/layout.en-US.md`
- `refs/ant-design/docs/spec/buttons.en-US.md`
- `refs/ant-design/components/layout/index.en-US.md` (nav sizes, Sider width, breakpoints)
- `refs/ant-design/components/result/index.en-US.md` (result statuses)

Reference app: `github.com/ant-design/ant-design-pro` at commit `ecee481bbb955aaeeaf3f46240fc35136bbed584` (package.json version 6.0.3, antd ^6.6.0, `@ant-design/pro-components` ^3.1.14-2). Files read: `package.json`, `config/routes.ts`, `config/defaultSettings.ts`, `src/pages/table-list/index.tsx`, `src/pages/list/basic-list/index.tsx`, `src/pages/list/search/index.tsx`, `src/pages/list/search/articles/index.tsx`, `src/pages/profile/basic/index.tsx`, `src/pages/profile/advanced/index.tsx`, `src/pages/form/basic-form/index.tsx`, `src/pages/form/step-form/index.tsx`, `src/pages/form/advanced-form/index.tsx`, `src/pages/result/success/index.tsx`, `src/pages/result/fail/index.tsx`, `src/pages/exception/403/index.tsx`, `src/pages/exception/404/index.tsx`, `src/pages/exception/500/index.tsx`, `src/pages/account/settings/index.tsx`, `src/pages/dashboard/workplace/index.tsx`. npm dist-tags for `@ant-design/pro-components` checked 2026-10-20: `latest` 2.8.10, `beta` 3.1.15-7.

## Cross-reference

- [dashboard-composition.md](dashboard-composition.md): analysis and monitor dashboards
- [settings-page.md](settings-page.md): settings layouts, save bar, destructive zone
- [list-and-feed.md](list-and-feed.md): list rows, load more vs pagination, loading states
- [form-design.md](form-design.md): field anatomy, validation, multi-step affordances
- [error-states.md](error-states.md): error copy, 403/404/5xx detail, error code visibility
- [empty-states.md](empty-states.md): the four kinds of empty
- [search-ux.md](search-ux.md): typeahead, faceted filters, Korean IME
- [money-and-amount.md](money-and-amount.md): amounts, units, tabular numerals
- [korean-density-conventions.md](../i18n/korean-density-conventions.md): Korean B2B density baseline
