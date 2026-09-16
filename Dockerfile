# Site Mars Labs — imagen estática (Astro SSG → nginx)
# Multi-stage: build del SSG en node, serve en nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: dentro de la imagen no hay repo git ni hacen falta los git
# hooks (el script `prepare` → `lefthook install` fallaría). esbuild/rollup
# funcionan igual: sus binarios vienen en optionalDependencies.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80