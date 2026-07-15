# 제품 전문화 벤치마크

`design-ai benchmark`는 Design AI가 집중하는 작업 흐름을 반복해서 검증하는
명령입니다. 제품이 실제로 사용하는 계약 위에서 다음 네 사례를 실행합니다.

- 새 디자인 브리프를 에이전트용 디자인 계약으로 전환
- 기존 제품 화면을 증빙에 따라 제한적으로 리팩터링
- 명시적으로 선택한 리뷰 팩을 이용한 한국 핀테크 UX 검토
- 두 에이전트 역할 사이에서 계약을 바꾸지 않고 인계

모든 사례는 회귀 검사용 합성 fixture입니다. 로컬 계약 동작과 finding precision을
증명하지만 실제 고객 채택, 운영 성과, 첫 결과 소요 시간을 증명하지는 않습니다.

## 실행

```bash
design-ai benchmark
design-ai benchmark --strict --json
design-ai benchmark --list
design-ai benchmark korean-product-ux --strict
```

사례 ID가 없으면 네 사례를 모두 실행합니다. 계약이 유효하지 않거나 기대한 finding
ID와 실제 finding ID가 다르면 `--strict`가 0이 아닌 종료 코드를 반환합니다.
`--json`은 이식 가능한 보고서를 출력하고, `--list`는 실행 없이 목록만 읽습니다.

## 비교 내용

품질 비교 사례는 변경 전과 후의 기대·실제 confirmed finding, 빠진 finding,
뜻밖의 finding, 수정으로 제거된 finding, 런타임 증빙이 없어 계속 `unverified`여야
하는 위험을 따로 보여줍니다.

종합 품질 점수는 만들지 않습니다. 하나의 숫자는 false positive, 누락된 접근성
문제, 실행하지 않은 동작을 서로 같은 것으로 보이게 만듭니다. pass와 fail은 회귀
제어에만 사용하고 판단 근거 목록은 그대로 남깁니다.

## 권한 경계

명령은 패키지에 포함된 fixture와 Design AI 코퍼스만 읽습니다. 로컬 파일을 쓰거나,
브라우저를 열거나, fixture 코드를 실행하거나, 대상 저장소를 변경하거나, 외부
서비스를 호출하지 않습니다. 새 디자인과 멀티 에이전트 사례는 이후 저장소 수정이
승인 목록 뒤에 남아 있는지도 확인합니다.

## 사례 기록

- [새 디자인 계약](case-studies/new-design-contract.md)
- [기존 제품 리팩터링](case-studies/existing-product-refactor.md)
- [한국형 제품 UX](case-studies/korean-product-ux.md)
- [멀티 에이전트 인계](case-studies/multi-agent-handoff.md)

각 문서는 source, change, verification, permission boundary, remaining risk,
claim boundary를 기록합니다. 여섯 구역과 참조 파일이 npm 패키지 안에 있을 때만
공개 증빙으로 취급합니다.
