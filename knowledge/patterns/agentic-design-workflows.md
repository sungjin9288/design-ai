<!-- hand-written -->
---
title: Agentic design workflows
applies_to: [ai-agent, design-systems, website-improvement, motion, handoff]
version: 1.0.0
last_updated: 2026-07
stability: beta
sources:
  - https://github.com/CopilotKit/OpenTag
  - https://github.com/nexu-io/open-design
  - https://wwit.design/
  - https://reactbits.dev/
  - https://github.com/DavidHDev/react-bits
---

# Agentic design workflows

Design work is increasingly executed by coding agents, MCP tools, local preview surfaces, and copy-ready component libraries. This file defines the design rules for that workflow. It is not model training guidance, prompt hype, or permission to copy another product's visual assets.

Use this file when a task asks an agent to generate, preview, critique, hand off, or implement design artifacts from external references.

## Reference scan

| Reference | Pattern to extract | Do not copy |
| --- | --- | --- |
| OpenTag | Thread-native agent UX: rich inline results, structured tool output, and human approval before external writes. | Slack-specific UI, exact copy, or CopilotKit implementation details. |
| Open Design | Agent-native studio model: design system contract, artifact modes, local preview, export targets, plugin/skill packaging, MCP install path. | Brand systems, templates, screenshots, or plugin manifests verbatim. |
| WWIT | Korean app pattern taxonomy by industry, flow, and component; useful for browsing real mobile conventions before designing KR consumer flows. | App screenshots, proprietary UI, or a single app's pattern as a universal rule. |
| React Bits | Animated component catalog: text effects, backgrounds, interactive components, style/language variants, dependency disclosure, copy-ready adoption. | Decorative effects without product intent, code copied without license review, or motion that ignores reduced motion. |

## Core rules

### 1. Write the artifact contract first

Before asking an agent to generate a design artifact, define the contract:

| Field | Required decision |
| --- | --- |
| Artifact mode | Prototype, live dashboard, deck, image, video, component spec, handoff report, or refactor prompt. |
| Source of truth | Brief, `DESIGN.md`, token file, Figma URL, live site, repo path, data snapshot, or screenshot set. |
| Output format | Markdown, HTML, React, CSS variables, JSON manifest, PDF/PPTX/MP4 export, or bundle directory. |
| Preview surface | Browser iframe, static HTML, local app route, screenshot, Storybook, docs page, or chat card. |
| Verification | Accessibility, responsive viewport, reduced motion, content accuracy, source links, export integrity, and repo tests. |
| Mutation boundary | Read-only planning, local file writes, target repo mutation, external tool write, or deployment. |

Agents drift when artifact mode is implicit. A deck, a landing page, and a Slack card can all show "a summary", but they need different hierarchy, density, interaction, and verification.

### 2. Treat `DESIGN.md` as a brand contract

For agent-generated visual work, a brand contract beats scattered instructions. The contract should fit in one document and cover:

- color roles and contrast constraints
- typography scale and language rules
- spacing, radius, elevation, and density
- component defaults and forbidden variants
- motion personality and reduced-motion fallback
- voice, brand cues, imagery, and anti-patterns

The design system builder may output `DESIGN.md` alongside token files so agents can read one canonical brand contract before generating artifacts.

### 3. Gate external writes with human approval

Any action that writes outside the local draft artifact needs an explicit approval state:

| Write target | Gate requirement |
| --- | --- |
| GitHub issue, Linear issue, Notion page, Slack post | Show action, destination, title/body summary, and a Create/Cancel choice. |
| Target repo file edit | Require repo intake, diff preview, verification command, and user-confirmed scope when destructive. |
| Deployment or publish | Require exact target, version, environment, rollback note, and verification plan. |
| Design-system token migration | Require affected token list, component impact, and before/after validation. |

Approval UI must update after the decision so the conversation or handoff log shows whether the write happened.

### 4. Render structured previews, not prose pretending to be UI

When an agent presents data or a decision artifact, choose the smallest structured preview:

| Content | Preferred preview |
| --- | --- |
| One created issue/task | Status card with title, owner, priority, link, and next action. |
| Multiple tasks | Table or task list with sort key, status, owner, priority, evidence, and link. |
| Quantitative comparison | Chart with chart type, units, data source, and no animation by default. |
| Website improvement handoff | Checklist/runbook with action status, evidence status, command, and risk. |
| Design-system output | Token table, component matrix, and preview swatches with contrast notes. |

Every structured preview needs provenance: what data was used, what was inferred, and what still needs manual verification.

### 5. Reference mining is taxonomy extraction

When using outside references, extract categories and constraints, not visual ownership:

1. Name the reference and its role.
2. List the reusable pattern category: flow, component, layout, motion, artifact contract, or operational workflow.
3. Capture the decision rule in your own words.
4. Record what not to copy.
5. Map the pattern into this repo's existing knowledge file or skill playbook.

For Korean product UX, use WWIT-style browsing as a taxonomy pass: industry -> flow -> component. Compare at least three examples before claiming a market convention.

### 6. Animated component libraries need an adoption gate

Animated libraries can raise the quality floor, but they can also add noise and bundle cost. Before recommending one:

| Check | Pass condition |
| --- | --- |
| Intent | Motion supports a product goal: orientation, feedback, hierarchy, delight, or brand moment. |
| Category | Classify as text animation, background, component, cursor/gesture, loading, or decorative layer. |
| Dependency | State required packages, runtime size risk, and whether CSS-only is enough. |
| Variant | Name the implementation target: JS/TS and CSS/Tailwind or local equivalent. |
| Customization | List props/tokens the team can safely tune without editing internals. |
| Accessibility | `prefers-reduced-motion`, keyboard reachability, pause/stop/hide for loops, and contrast. |
| Performance | Animate `opacity`/`transform` first; pause offscreen loops; avoid full-screen filters on low-end devices. |
| Ownership | Check license, copy strategy, attribution expectation, and long-term maintenance. |

Default to adapting the pattern into the product's own token/motion system. Do not install a library to solve one hover state.

## Template: agentic design brief

```markdown
# Agentic design brief: <artifact>

## Source of truth
- Brief:
- Brand contract / DESIGN.md:
- Target repo or site:
- External references:

## Artifact contract
| Field | Decision |
| --- | --- |
| Mode | <prototype / dashboard / deck / component / handoff / prompt> |
| Output | <Markdown / HTML / React / JSON / bundle> |
| Preview | <browser / screenshot / chat card / docs page> |
| Mutation boundary | <read-only / local writes / target repo / external write> |
| Verification | <commands and manual QA> |

## Reference mining
| Reference | Pattern extracted | Local mapping | Do not copy |
| --- | --- | --- | --- |

## Approval gates
| Action | Gate | Evidence |
| --- | --- | --- |

## Accessibility and motion
- Contrast:
- Keyboard:
- Reduced motion:
- Loop/pause behavior:

## Done when
- Artifact renders or exports.
- Source links and provenance are included.
- Verification evidence is recorded.
- External writes were approved or explicitly skipped.
```

## Don't

- Do not treat a screenshot gallery as permission to clone a visual system.
- Do not present generated tables/charts without data provenance.
- Do not let an agent create issues, pages, commits, deployments, or published artifacts without a visible approval or verification boundary.
- Do not add decorative animation just because an animated component exists.
- Do not claim a Korean-market convention from a single app example.
