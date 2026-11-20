# 다진 프론트 이미지: 빌드(Node) → 정적 파일을 Nginx 로 서비스하고 /api 는 백엔드로 넘긴다.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# 같은 도메인으로 /api 를 부르므로 백엔드 주소를 비운다 (Nginx 가 넘겨 준다)
ENV VITE_API_BASE_URL=""
ENV VITE_USE_MOCK="false"
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
