# ==========================================
# PokéSurvivor - Dockerfile de Produção para Coolify / VPS
# ==========================================
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia todos os assets e arquivos do jogo para o diretório raiz web
COPY . /usr/share/nginx/html/

# Remove arquivos e pastas desnecessários para a imagem de produção
RUN rm -rf /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.github \
           /usr/share/nginx/html/tools/cache \
           /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/docker-compose.yml \
           /usr/share/nginx/html/nginx.conf

# Porta de serviço padrão HTTP
EXPOSE 80

# Healthcheck interno para validação contínua no Coolify
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Inicializa o Nginx em modo foreground
CMD ["nginx", "-g", "daemon off;"]
