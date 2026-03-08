# PyFree 배포 컨테이너
# Phase 4-3: 배포 자동화

# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY tsconfig.json ./
COPY src ./src

# 빌드
RUN npm run build

# 런타임 스테이지
FROM node:18-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 진입점
ENTRYPOINT ["node", "dist/repl.js"]
CMD []

# 메타데이터
LABEL maintainer="PyFree Project"
LABEL description="PyFree - Python + FreeLang Hybrid Language"
LABEL version="0.2.0"
