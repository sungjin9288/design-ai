import { suggestNearest } from "./suggest.mjs";

export const ROUTES = [
  {
    id: "design-review",
    label: "Design review",
    command: "commands/design-review.md",
    skills: ["skills/ux-audit/SKILL.md", "skills/design-critique/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/ux-guidelines.md",
      "knowledge/a11y/contrast.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["audit", "review", "critique", "figma", "screenshot", "ux", "a11y", "accessibility", "리뷰", "감사", "평가", "비평", "접근성", "스크린샷"],
  },
  {
    id: "design-engineering-review",
    label: "Design engineering review",
    command: null,
    skills: [
      "skills/design-engineering-review/SKILL.md",
      "skills/ux-audit/SKILL.md",
      "skills/motion-designer/SKILL.md",
    ],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/interface-craft.md",
      "knowledge/motion/principles.md",
      "knowledge/motion/micro-interactions.md",
      "knowledge/a11y/keyboard-and-focus.md",
      "knowledge/a11y/contrast.md",
    ],
    keywords: [
      "design engineering", "interface craft", "ui polish", "interaction quality",
      "animation audit", "motion audit", "perceived responsiveness", "interruptibility",
      "premium feel", "polish this app", "polish this ui",
      "디자인 엔지니어링", "인터페이스 완성도", "UI 퀄리티", "앱 퀄리티",
      "웹 퀄리티", "디자인 퀄리티", "인터랙션 퀄리티", "인터랙션 반응성", "모션 감사", "반응성 개선",
    ],
  },
  {
    id: "website-improvement",
    label: "Website improvement",
    command: "commands/website-improvement.md",
    skills: ["skills/website-improvement/SKILL.md", "skills/ux-audit/SKILL.md", "skills/handoff-spec/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/ux-guidelines.md",
      "knowledge/a11y/contrast.md",
      "knowledge/a11y/keyboard-and-focus.md",
      "knowledge/layout/spacing-and-grid.md",
      "knowledge/patterns/report-design.md",
      "docs/MCP-INTEGRATION.md",
      "docs/WEBSITE-IMPROVEMENT.md",
    ],
    keywords: [
      "website", "webpage", "homepage", "landing", "seo", "performance",
      "lighthouse", "core web vitals", "mcp", "refactor plan", "handoff report",
      "site profile", "implement homepage", "build homepage", "homepage implementation",
      "refactor homepage", "homepage refactor", "existing homepage",
      "웹사이트", "홈페이지", "랜딩", "성능", "검색엔진", "개선", "리팩터",
      "홈페이지 구현", "홈페이지 개발", "홈페이지 리팩토링", "홈페이지 리팩터링",
      "기존 홈페이지", "신규 홈페이지",
    ],
  },
  {
    id: "agentic-design-development",
    label: "Agentic design development",
    command: null,
    skills: ["skills/website-improvement/SKILL.md", "skills/design-system-builder/SKILL.md", "skills/handoff-spec/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/agentic-design-workflows.md",
      "knowledge/patterns/design-system-qa.md",
      "knowledge/patterns/technical-writing.md",
      "docs/AGENT-DEVELOPMENT.md",
      "docs/SDK.md",
      "docs/MCP-INTEGRATION.md",
    ],
    keywords: [
      "agentic design", "agentic workflow", "internal skill", "skill development",
      "feature development", "reference mining", "artifact contract", "human gate",
      "approval gate", "design-ai feature", "design-ai skill", "mcp feature", "mcp tool",
      "sdk surface", "plugin surface",
      "내부 스킬", "스킬 개발", "스킬 디밸롭", "기능 디밸롭", "우리 기능",
      "내부 기능", "에이전트형", "레퍼런스 분석", "레퍼런스 마이닝",
      "승인 게이트", "아티팩트 계약", "기능 개발",
    ],
  },
  {
    id: "design-from-brief",
    label: "Design system from brief",
    command: "commands/design-from-brief.md",
    skills: ["skills/color-palette/SKILL.md", "skills/design-system-builder/SKILL.md", "skills/handoff-spec/SKILL.md"],
    knowledge: [
      "knowledge/patterns/ui-reasoning.md",
      "knowledge/patterns/styles-catalog.md",
      "knowledge/layout/spacing-and-grid.md",
      "knowledge/typography/type-scale-fundamentals.md",
    ],
    keywords: ["brief", "design system", "brand", "tokens", "foundation", "app", "product", "startup", "서비스", "브랜드", "디자인 시스템", "토큰", "앱", "프로덕트"],
  },
  {
    id: "component-spec",
    label: "Component spec",
    command: "commands/component-spec.md",
    skills: ["skills/component-spec-writer/SKILL.md"],
    agents: ["agents/component-architect.md", "agents/a11y-reviewer.md"],
    knowledge: [
      "knowledge/components/INDEX.md",
      "knowledge/components/shadcn-registry.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["component", "button", "input", "modal", "dialog", "table", "form", "dropdown", "select", "spec", "api", "props", "컴포넌트", "버튼", "입력", "모달", "폼", "테이블", "스펙"],
  },
  {
    id: "palette-from-brand",
    label: "Palette from brand",
    command: "commands/palette-from-brand.md",
    skills: ["skills/color-palette/SKILL.md"],
    knowledge: [
      "knowledge/colors/color-theory.md",
      "knowledge/a11y/contrast.md",
      "knowledge/design-tokens/tailwind-v4.md",
    ],
    keywords: ["color", "palette", "theme", "dark mode", "hex", "oklch", "색", "색상", "컬러", "팔레트", "다크모드"],
  },
  {
    id: "motion-design",
    label: "Motion design",
    command: "commands/motion-design.md",
    skills: ["skills/motion-designer/SKILL.md"],
    knowledge: [
      "knowledge/motion/principles.md",
      "knowledge/motion/micro-interactions.md",
      "knowledge/motion/choreography-depth.md",
    ],
    keywords: ["motion", "animation", "transition", "framer", "gsap", "lottie", "모션", "애니메이션", "전환", "인터랙션"],
  },
  {
    id: "illustration",
    label: "Illustration",
    command: "commands/illustration.md",
    skills: ["skills/illustration-designer/SKILL.md"],
    knowledge: [
      "knowledge/illustration/illustration-systems.md",
      "knowledge/illustration/spot-illustrations.md",
      "knowledge/illustration/mascot-design.md",
    ],
    keywords: ["illustration", "mascot", "svg", "empty state", "hero art", "일러스트", "마스코트", "캐릭터", "빈 상태"],
  },
  {
    id: "print",
    label: "Print design",
    command: "commands/print.md",
    skills: ["skills/print-designer/SKILL.md"],
    knowledge: [
      "knowledge/print/print-fundamentals.md",
      "knowledge/print/stationery.md",
      "knowledge/print/packaging.md",
    ],
    keywords: ["print", "business card", "brochure", "packaging", "poster", "cmyk", "bleed", "인쇄", "명함", "브로셔", "패키지", "포스터"],
  },
  {
    id: "video",
    label: "Video design",
    command: "commands/video.md",
    skills: ["skills/video-designer/SKILL.md"],
    knowledge: [
      "knowledge/video/video-fundamentals.md",
      "knowledge/video/marketing-video.md",
      "knowledge/video/social-and-short-form.md",
    ],
    keywords: ["video", "reels", "shorts", "tiktok", "caption", "subtitles", "영상", "비디오", "릴스", "쇼츠", "자막"],
  },
  {
    id: "game-ui",
    label: "Game UI",
    command: "commands/game-ui.md",
    skills: ["skills/game-ui-designer/SKILL.md"],
    knowledge: [
      "knowledge/game-ui/game-ui-fundamentals.md",
      "knowledge/game-ui/hud-design.md",
      "knowledge/game-ui/menu-systems.md",
    ],
    keywords: ["game", "hud", "inventory", "gacha", "cooldown", "게임", "인벤토리", "확률", "뽑기"],
  },
  {
    id: "conversational",
    label: "Conversational UI",
    command: "commands/conversational.md",
    skills: ["skills/conversational-ui-designer/SKILL.md"],
    knowledge: [
      "knowledge/conversational/ai-chat-interfaces.md",
      "knowledge/conversational/chatbot-design.md",
      "knowledge/conversational/korean-voice-conventions.md",
    ],
    keywords: ["chatbot", "voice", "assistant", "ai chat", "conversation", "챗봇", "대화", "음성", "어시스턴트"],
  },
  {
    id: "spatial",
    label: "Spatial design",
    command: "commands/spatial.md",
    skills: ["skills/spatial-designer/SKILL.md"],
    knowledge: [
      "knowledge/spatial/spatial-design-fundamentals.md",
      "knowledge/spatial/vr-patterns.md",
      "knowledge/spatial/ar-patterns.md",
    ],
    keywords: ["spatial", "vr", "ar", "xr", "vision pro", "webxr", "immersive", "공간", "증강현실", "가상현실"],
  },
  {
    id: "document-from-brief",
    label: "Documentation",
    command: "commands/document-from-brief.md",
    skills: ["skills/document-author/SKILL.md"],
    knowledge: [
      "knowledge/patterns/information-architecture.md",
      "knowledge/patterns/technical-writing.md",
      "knowledge/patterns/document-typography.md",
    ],
    keywords: ["documentation", "docs", "guide", "manual", "readme", "diataxis", "문서", "가이드", "매뉴얼", "기술문서"],
  },
  {
    id: "slide-deck",
    label: "Slide deck",
    command: "commands/slide-deck.md",
    skills: ["skills/slide-deck-author/SKILL.md"],
    knowledge: [
      "knowledge/patterns/slide-deck-design.md",
      "knowledge/patterns/report-design.md",
    ],
    keywords: ["slide", "deck", "presentation", "pitch", "ppt", "슬라이드", "발표", "제안서", "피치덱"],
  },
  {
    id: "handoff-spec",
    label: "Design handoff",
    command: null,
    skills: ["skills/handoff-spec/SKILL.md"],
    knowledge: [
      "knowledge/patterns/technical-writing.md",
      "knowledge/design-tokens/ant-design.md",
    ],
    keywords: ["handoff", "engineering", "developer", "implementation spec", "dev spec", "핸드오프", "개발 전달", "개발자"],
  },
  {
    id: "design-system-qa",
    label: "Design system QA",
    command: null,
    skills: ["skills/design-system-qa/SKILL.md"],
    knowledge: [
      "knowledge/patterns/design-system-qa.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["qa", "test", "regression", "visual regression", "storybook", "contract", "테스트", "회귀", "품질"],
  },
  {
    id: "figma-token-sync",
    label: "Figma token sync",
    command: null,
    skills: ["skills/figma-token-sync/SKILL.md"],
    knowledge: [
      "knowledge/design-tokens/ant-design.md",
      "knowledge/design-tokens/tailwind-v4.md",
    ],
    keywords: ["figma token", "token sync", "variables", "figma variables", "피그마 토큰", "토큰 동기화", "변수"],
  },
  {
    id: "design-pr-review",
    label: "Design PR review",
    command: null,
    skills: ["skills/design-pr-review/SKILL.md"],
    knowledge: [
      "knowledge/patterns/design-system-qa.md",
      "knowledge/a11y/contrast.md",
    ],
    keywords: ["pull request", "pr", "github", "diff", "code review", "깃허브", "코드 리뷰", "PR"],
  },
  {
    id: "stability-review",
    label: "Stability review",
    command: "commands/stability-review.md",
    skills: [],
    knowledge: [
      "docs/RELEASE-CHECKLIST.md",
      "docs/CONTRIBUTING.md",
    ],
    keywords: ["release", "stability", "stale", "quarterly", "launch", "릴리스", "안정화", "오래된", "출시"],
  },
  {
    id: "flow-design",
    label: "Feature flow design",
    command: null,
    skills: ["skills/ux-audit/SKILL.md", "skills/design-critique/SKILL.md"],
    agents: ["agents/a11y-reviewer.md"],
    knowledge: [
      "knowledge/patterns/ui-reasoning.md",
      "knowledge/patterns/async-control.md",
      "knowledge/patterns/trust-safety-moderation.md",
      "knowledge/patterns/form-design.md",
      "knowledge/patterns/error-states.md",
      "knowledge/patterns/onboarding.md",
    ],
    keywords: [
      "플로우", "신고", "차단", "온보딩", "회원가입", "결제 플로우", "설정 화면", "알림 설정",
      "모더레이션", "처리 상태", "사용자 여정",
      "flow design", "onboarding flow", "sign-up flow", "signup flow", "checkout flow",
      "report flow", "block flow", "moderation flow", "user journey", "wizard", "stepper",
      "settings screen", "notification settings",
      // G-2 (docs/DOGFOOD-DASHBOARD-FINDINGS.md): Korean wizard/step vocabulary that the
      // v4.62 keyword set missed (English wizard/stepper made it in, Korean forms didn't).
      "위저드", "단계별 플로우", "스텝", "이어하기",
      // G-3 (docs/DOGFOOD-DASHBOARD-FINDINGS.md): compound state-design keywords so a
      // states-design brief outscores illustration's bare `빈 상태` hit. Kept compound
      // (not bare `상태`/`에러`/`빈`) to avoid hijacking other routes' bare terms.
      "에러 상태", "빈 상태 화면", "상태 설계", "검색 결과 없음", "empty state", "error state",
      // Phase 768 (docs/ROUTE-COVERAGE-SWEEP.md): nine interaction-flow sweep classes
      // (checkout, notifications, account, file-upload, collaboration, product-tour,
      // search-filter, navigation, long-form) were zero/low/misrouted despite curated
      // knowledge (search-ux.md, mobile-navigation.md, information-architecture.md,
      // settings-page.md) reaching them through recall. `product tour` is kept as a
      // compound even though it substring-contains design-from-brief's bare `product`,
      // because the extra flow-design keyword hits on the same brief (온보딩, 투어,
      // 코치마크) outweigh design-from-brief's single hit.
      "체크아웃", "알림 센터", "계정 관리", "프로필 수정", "회원 탈퇴", "업로드", "드래그 앤 드롭",
      "댓글", "멘션", "공유 권한", "코치마크", "투어", "필터", "정렬", "무한 스크롤",
      "내비게이션", "하단 탭", "다단계",
      "checkout", "notification center", "account management", "file upload", "drag and drop",
      "comment thread", "mention", "coachmark", "product tour", "infinite scroll", "bottom tab",
      "multi-step",
      // Sweep long-form class (docs/ROUTE-COVERAGE-SWEEP.md): a multi-step form brief
      // ("다단계 입력... 임시저장... 유효성 검증") tied against component-spec's bare
      // `입력`/`폼` hits without these two. `임시저장` (save-draft) and `유효성 검증`
      // (validation timing) are flow-specific signals distinct from a static
      // component contract, and neither collides with any other route's keywords.
      "임시저장", "유효성 검증",
    ],
  },
  {
    id: "dashboard-design",
    label: "Dashboard / data screen design",
    command: null,
    skills: ["skills/design-critique/SKILL.md", "skills/handoff-spec/SKILL.md"],
    agents: ["agents/a11y-reviewer.md"],
    knowledge: [
      "knowledge/patterns/dashboard-composition.md",
      "knowledge/patterns/chart-types.md",
      "knowledge/patterns/chart-color-encoding.md",
      "knowledge/patterns/realtime-data.md",
      "knowledge/patterns/money-and-amount.md",
      "knowledge/i18n/korean-density-conventions.md",
      "knowledge/patterns/list-and-feed.md",
      "knowledge/layout/spacing-and-grid.md",
      "knowledge/typography/type-scale-fundamentals.md",
    ],
    keywords: [
      // G-1 (docs/DOGFOOD-DASHBOARD-FINDINGS.md): dashboard/admin/back-office screen
      // briefs previously matched zero route keywords and fell through to
      // design-from-brief. Compound where a bare term would hijack another route
      // (`테이블` bare belongs to component-spec; `데이터` bare is too generic for any
      // single route, so it is only used here in the compound `데이터 테이블`).
      "대시보드", "정산", "매출 화면", "지표", "어드민", "백오피스", "데이터 테이블",
      "정산 내역", "KPI",
      "dashboard", "admin panel", "back-office", "back office", "analytics screen", "data table",
      // Phase 768 (docs/ROUTE-COVERAGE-SWEEP.md): data-viz and rbac-admin sweep classes
      // matched zero route keywords despite dedicated knowledge (chart-types.md,
      // chart-color-encoding.md, realtime-data.md) already existing. Bare `chart` is
      // safe (no other route claims it); `permissions matrix`/`role management` are
      // compound so they don't hijack shorter generic terms from other routes.
      "차트", "데이터 시각화", "시계열", "범례", "권한 관리", "역할 관리", "권한",
      "chart", "data visualization", "time series", "legend", "permissions matrix", "role management",
    ],
  },
  {
    id: "marketing-page",
    label: "Marketing page & campaign surface design",
    command: null,
    skills: ["skills/design-critique/SKILL.md", "skills/handoff-spec/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/landing-hero-design.md",
      "knowledge/patterns/landing-page-patterns.md",
      "knowledge/patterns/pricing-page-design.md",
      "knowledge/patterns/email-design.md",
      "knowledge/patterns/brand-identity.md",
    ],
    keywords: [
      // Phase 768 (docs/ROUTE-COVERAGE-SWEEP.md): landing, pricing-page, and
      // email-template sweep classes were zero-match or misrouted (landing fell
      // through to handoff-spec via bare `개발자`; email-template misrouted to
      // palette-from-brand via bare `다크모드`) despite dedicated knowledge files
      // already existing. `랜딩 페이지` is compound because `website-improvement` owns
      // bare `랜딩`; `히어로`/`히어로 섹션` are safe (no other route claims them).
      "랜딩 페이지", "히어로", "히어로 섹션", "가격 페이지", "플랜 비교", "이메일 템플릿",
      "CTA", "전환율",
      "landing page", "pricing page", "hero section", "email template", "campaign page",
    ],
  },
];

export function routeIds() {
  return ROUTES.map((route) => route.id);
}

export function suggestRouteId(routeId, ids = routeIds()) {
  return suggestNearest(routeId, ids);
}

export function unknownRouteIdMessage(routeId, ids = routeIds()) {
  const suggestion = suggestRouteId(routeId, ids);
  const lines = [`Unknown route id: ${routeId}.`];
  if (suggestion) lines.push(`Did you mean \`${suggestion}\`?`);
  lines.push(`Available routes: ${ids.join(", ")}`);
  return lines.join("\n");
}

export function assertKnownRouteId(routeId, { allowEmpty = true } = {}) {
  if (!routeId && allowEmpty) return;
  if (ROUTES.some((route) => route.id === routeId)) return;
  throw new Error(unknownRouteIdMessage(routeId));
}
