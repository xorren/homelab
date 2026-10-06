# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

본인 혼자 사용하는 단일 사용자 도구. 보안 진단 업무를 하는 사람이 개인 노트북에서 테스트 서버들을 운영하며 공부·실습한다. VMware VM, Windows 로컬 서비스(SQL 인젝션·XSS·PHP 테스트 서버 등) 모두 한 화면에서 관리하고 싶다.

## Product Purpose

개인 노트북에서 운영하는 모든 테스트 서버를 브라우저 하나로 관리한다. VMware Workstation GUI나 별도 SSH 클라이언트 없이 서버 상태 확인, 전원 제어, SSH 접속, 공부 메모를 처리한다. 나중에 전용 서버 컴퓨터를 구매하면 그 위에 그대로 이전해 쓸 수 있다.

## Positioning

보안 진단가의 개인 테스트 랩을 위한 단일 관리 창구. VMware VM은 물론 Windows에서 직접 실행하는 공격 구문 테스트 서버들(PHP, SQL, XSS 등)까지 하나의 대시보드로 본다. 일반 서버 모니터링 도구와 달리 VM 전원 제어, 브라우저 SSH 터미널, 서버별 학습 메모가 한데 묶여 있다.

## Operating Context

- 노트북 한 대가 호스트이자 서버 컴퓨터
- VMware Workstation Pro 17 (vmrest.exe, vmrun.exe 내장)
- 현재 구현 범위: VMware VM 관리 (v1)
- 향후 확장 예정: Windows 로컬 프로세스(XAMPP, 커스텀 서버 등) 관리 (v2+)
- 로컬 실행 기본, 필요 시 포트포워딩으로 외부 접속
- 단일 비밀번호 인증

## Capabilities and Constraints

- VM 전원 제어: 시작 / 정지 / 일시정지 / 재개
- 호스트 리소스 모니터링: CPU, RAM, 디스크
- VM별 공부 메모 (SQLite 저장)
- 브라우저 SSH 터미널 (xterm.js + node-pty)
- 한국어/영어 UI 전환
- Node.js 필요, 별도 DB 서버 없음 (SQLite 파일)
- Windows 환경 (노트북)

## Brand Commitments

- 제품명: **homelab**
- 미학: 터미널/해커 분위기 — Kali Linux 스타일. 검은 배경, 모노스페이스 폰트, cyan 네온 포인트컬러. AI가 만든 느낌(보라색 그라데이션, 카드 남발, 둥근 모서리 과다) 금지.
- UI 언어: 영어 기본, 한국어 전환 가능
- 번역체·AI 문체 금지

## Evidence on Hand

- 구현 시작됨: Next.js 15 + TypeScript + Tailwind + SQLite + vmrest 기반 스캐폴드 (티켓 01 완료)
- 티켓 02–09 스펙 작성 완료 (.scratch/homelab/issues/)
- 실제 사용자 = 개발자 본인 (테스트 가능)

## Product Principles

1. **터미널이 홈이다** — 인터페이스는 브라우저지만 느낌은 CLI. 모노스페이스, 낮은 채도, 정보 밀도.
2. **마찰 없이 빠르게** — VMware 열지 않고도 서버 켜고 끄고 SSH 들어간다.
3. **기록이 곧 자산** — 어떤 VM에서 뭘 배웠는지 메모가 남는다.
4. **확장 가능한 단순함** — v1은 VMware만. 구조는 처음부터 다른 서버 유형을 수용할 수 있게.
