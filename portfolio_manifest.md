# Portfolio Package Manifest

## 프로젝트 정보

- 프로젝트명: design-ai
- 용도: 커리어(채용·이력서·면접)용 포트폴리오
- 갱신일: 2026-10-20 (이전 판: 2026-06-22, `_portfolio_export/archive-2026-06/`에 보관)
- 현재 상태: v5.4.0 공개 배포 완료. 기능 개발은 동결하고 유지보수 전환을 검토 중입니다.
- 핵심 기술: Node.js ESM CLI·SDK·MCP 서버, Python 검증 하네스, 의존성 없는 정적 Console, TypeScript VS Code 확장, GitHub Actions와 npm Trusted Publishing

## 패키지 구성 (`_portfolio_export/design_ai_portfolio_pack/`)

| 경로 | 내용 |
|---|---|
| `README.md`, `README.ko.md`, `links.md`, `portfolio_manifest.md` | 프로젝트 소개, 공개 링크, 이 manifest |
| `docs/project-card.md` | 한 장 요약: 규모, 표면, 아키텍처, 결과와 한계 |
| `docs/case-study.md` | 사례 3개: 자기 적용으로 찾은 결함, 하위 호환 계약 변경, 릴리스 엔지니어링 |
| `docs/resume-bullets.md` | 이력서 bullet, 직무별 강조점, 쓰면 안 되는 표현 |
| `docs/interview-story.md` | 1분 소개, STAR 사례 3개, 예상 질문 |
| `docs/CHANGELOG-v5.4.0.md` | v5.4.0 릴리스 노트 |
| `docs/external-status.md` | 공개 배포 채널별 증빙 |
| `docs/REVIEW-COMPARISON.md`, `docs/VISUAL-EVALUATORS.md`, `docs/PROJECT-CONTINUITY.md` | 사례에서 인용하는 계약 문서 |
| `evidence/release/` | npm 5.4.0 메타데이터(provenance 포함), GitHub Release 정보, 최신 `release:check` 요약 |
| `evidence/screenshots/` | Website Console(Audit Checklist 데스크톱·모바일, Quality Review), Image Console 화면. 고정 시계로 로컬에서 캡처했습니다 |

## 증빙의 출처와 한계

- 수치는 2026-10-20에 저장소, npm, GitHub에서 직접 확인했습니다.
- 2026-10-11 P17E·P17F 실행의 원시 증거(브라우저 증거, 비교 산출물, 스냅샷, 수정 전후 crop)는 세션 임시 디렉터리에 있었는데 정리되면서 사라졌습니다. 결과 수치와 판단은 머지된 PR(#78, #83, #87)과 `docs/ROADMAP.md` Phase 810~816에 남아 있고, 패키지는 이를 인용합니다.
- 외부 사용자, 실제 이미지 provider 연동, 독립 파일럿은 검증되지 않았으며 문서에 그렇게 적었습니다.

## 제외한 항목

- `.env`, API key, 토큰, 비밀번호
- `node_modules/`, `.git/`, 빌드 산출물
- 개인정보와 고객·기관 내부 자료
- 오래된 2026-06 증빙 로그: 당시 미배포 상태를 기록한 것이라 현재 사실과 충돌하므로 이전 판에만 남겼습니다

## 검증 결과

검증 결과는 패키지를 만든 뒤 `evidence/release/package-check.txt`에 기록합니다.
