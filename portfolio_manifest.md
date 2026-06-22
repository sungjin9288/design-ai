# Portfolio Package Manifest

## 프로젝트 정보

- 프로젝트명: design-ai
- 생성일: 2026-06-09
- 현재 상태: 고도화 중인 model-agnostic design intelligence toolkit
- 핵심 기술스택: Node.js ESM CLI, Markdown knowledge base, Python audit tooling, MkDocs Material, Vanilla JS static Website Console, TypeScript VS Code Extension
- 이력서 반영 가능 여부: 가능

## 포함 파일

- README.md
- README.ko.md
- DEV_LOG.md
- links.md
- portfolio_manifest.md
- docs/project-card.md
- docs/case-study.md
- docs/resume-bullets.md
- docs/interview-story.md
- docs/roadmap.md
  - repo 내부에서는 macOS case-insensitive 경로 충돌을 피하기 위해 `docs/project-roadmap.md`를 원본으로 유지하고, 압축 패키지 안에서 `docs/roadmap.md`로 복사함.
- docs/readme-improvement.md
- docs/implementation-evidence.md
- docs/evidence-checklist.md
- docs/evidence-gallery.md
- docs/external-status.md
- docs/DISTRIBUTION.md
- docs/DISTRIBUTION.ko.md
- docs/QUICKSTART.md
- docs/QUICKSTART.ko.md
- docs/USING.md
- docs/USING.ko.md
- docs/RELEASE-CHECKLIST.md
- docs/integrations/vscode-walkthrough.md
- docs/integrations/vscode-walkthrough.ko.md
- evidence/evidence_manifest.md
- evidence/cli-logs/
  - `release-check.log`, `ci-local.log`, `git-diff-check.log`, `zip-integrity.log`, `zip-contents.log`, `secret-scan.log` 포함
- evidence/output-artifacts/
- evidence/screenshots/
- evidence/architecture/
- evidence/api-responses/
- screenshots 폴더가 있으면 이미지 파일만 포함

## 제외한 파일/폴더

아래 항목은 압축에서 제외했습니다.

- .env
- API key
- 비밀번호/토큰
- node_modules/
- venv/
- .venv/
- __pycache__/
- dist/
- build/
- .git/
- 개인정보가 들어간 데이터
- 고객사/기관 내부자료
- 기타 민감정보

## 검증 결과

- 민감정보 포함 여부: 실제 API key 형태 패턴 및 금지 파일명 사전 검사에서 발견되지 않음
- 압축 파일 생성 여부: evidence 포함 버전으로 재생성 완료
- 압축 파일 경로: `_portfolio_export/design_ai_portfolio_pack.zip`
- 압축 파일명: `design_ai_portfolio_pack.zip`
- SHA-256 checksum 파일: `_portfolio_export/design_ai_portfolio_pack.zip.sha256`
- 압축 파일 크기: 약 2.8 MB
- 압축 파일 항목 수: 81개
- 압축 파일 내용 확인 여부: `zipinfo -1` 내부 목록 확인 및 `unzip -t` 무결성 검사 통과
- 포함 evidence 확인 여부: CLI logs, release-check log, ci-local log, external status logs, zip integrity/content logs, secret scan log, screenshots, output artifacts, architecture notes, audit results, API not-applicable note 포함 확인
- local CI 확인 여부: `npm run ci:local` 통과, VS Code Extension compile/unit test 및 MkDocs warning policy 포함 확인
