# R&D pj: Shopping UX Improvement

Tags: UX Engineering
Link: https://ux.snu.ac.kr/project/2022/05/06/naverShopping.html
Role: Researcher
Date: March 1, 2022 → June 30, 2022

### Summary

---

**쇼핑 플랫폼 UX 개선 — 참여 기간: 4개월(2022년 3월 ~ 2022년 6월)**

과제 성과:

- 국내 컨퍼런스 투고 :: 한국HCI학회 2023 [Actually, Clustering is Not Everything! How UXer analyzes behavior types with page log data: UXer가 페이지 로그 데이터로 행동 유형을 분석하는 방법] (2저자) (논문 링크: [https://www.dbpia.co.kr/pdf/pdfView.do?nodeId=NODE11229699&googleIPSandBox=false&mark=0&ipRange=false&b2cLoginYN=false&isPDFSizeAllowed=true&accessgl=Y&language=ko_KR&hasTopBanner=true](https://www.dbpia.co.kr/pdf/pdfView.do?nodeId=NODE11229699&googleIPSandBox=false&mark=0&ipRange=false&b2cLoginYN=false&isPDFSizeAllowed=true&accessgl=Y&language=ko_KR&hasTopBanner=true))

### Contributions

---

- 프로젝트는 쇼핑 시퀀스 파악 → 클러스터링 → 유저 인터뷰 로 진행
- **연구원으로서 쇼핑 시퀀스 파악 및 유저 인터뷰에 참여**

### Background

---

- 배경:
    - 네이버 쇼핑에서는 최저가 검색, 특정 물건 구매, 상품 둘러보기 등 다양한 사용자 행동이 나타남
    - 그러나 사용자는 획일화된 기능과 동일한 정보 인터페이스를 제공받고 있음
- 문제:
    - 로그 데이터를 기반으로 알 수 있는 사용자 행동 유형 별 최적의 쇼핑 프로세스는 무엇인가?

### Solutions

---

- 1단계: 쇼핑 시퀀스 파악
    - 네이버 쇼핑 사이트의 구조 파악
    - 위계와 콘텐츠를 중심으로 유사한 페이지들을 그루핑
    - 26개의 페이지 그룹 결과를 바탕으로 탐색-거래-재방문으로 쇼핑 시퀀스를 정의
- 2단계: 클러스터링
    - 로그 데이터의 ‘쇼핑 페이지’를 26개의 페이지 그룹에 맞추어 변환
    - 로그의 시간 간격과 쇼핑 유입에 따라 세션 분리
    - Feature Engineering 기반 K-Means 클러스터링
- 3단계: 유저 인터뷰
    - 참여자의 최근 구매한 제품 15개를 수집해, 행동 유형 마킹을 지시함
    - 구매한 제품에 대해 재연 과제를 부여하며, 제품별로 어떤 행동을 보이는지 관찰
    - think-aloud를 통해 특이 발화를 기록하며 제품별로 심화 질문
    - 태스크 종료 후, 심화 인터뷰를 진행해 전반적인 네이버 사용 경험을 파악함

### Insights

---

- 데이터 분석
    - 클러스터링 결과 사용자들의 쇼핑 유형을 5가지 유형으로 정리
    - 인터뷰 결과 다섯 개의 행동 유형 중 ‘일반적인 쇼핑’이 가장 많았고, ‘신중한 쇼핑’이 가장 적었음
- 인사이트
    - 제안1: 지속적인 UX 분석을 위해, 조건을 충족하는 여러 데이터를 ‘이벤트’로 정의하기
    - 제안2: 지속적인 사용자 행동 트래킹을 위한 UX 분석을 위한 대시보드 활용
    - 제안3: 데이터를 바탕으로, 제품 카테고리와 행동 유형 간의 상관 관계 심층 분석