# 🚀 Guia de Deploy no Coolify (VPS) — PokéSurvivor

Este guia detalha o passo a passo completo para colocar o **PokéSurvivor** online na sua VPS utilizando o **Coolify**, permitindo que qualquer pessoa acesse e jogue diretamente pelo navegador (desktop e mobile).

---

## 📋 Pré-Requisitos

1. **VPS com Coolify instalado** (Hetzner, DigitalOcean, Linode, AWS, Oracle Cloud ou qualquer servidor Linux com Docker).
2. **Repositório Git** (GitHub, GitLab ou repositório público/privado).
3. **Domínio ou Subdomínio apontado para o IP da sua VPS** (ex: `jogar.seudominio.com` ou `pokesurvivor.meusite.com`).

---

## ⚡ Passo a Passo de Deploy no Coolify

### 1. Criar um Novo Recurso no Painel do Coolify

1. Acesse o painel de controle do seu Coolify (ex: `https://app.seucoolify.com` ou `http://IP_DA_VPS:8000`).
2. Clique no seu **Projeto** e no seu **Ambiente** (ex: `production`).
3. Clique em **+ New Resource** (Novo Recurso) e selecione **Public Repository** (Repositório Público) ou **GitHub App** (se o repositório for privado).
4. Insira a URL do repositório:
   ```
   https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git
   ```
5. Defina a Branch como `main`.

---

### 2. Configuração do Tipo de Build (Automático)

O Coolify detectará automaticamente os arquivos criados no projeto:
- **Build Pack:** Selecione **Dockerfile** ou **Docker Compose** (ambos estão configurados e prontos na raiz).
- **Port:** Defina a porta de exposição como `80`.

---

### 3. Configurar Domínio e SSL Automático (HTTPS)

1. Na aba **General** (Geral) do aplicativo no Coolify:
2. No campo **Domains**, insira seu domínio completo com protocolo:
   ```
   https://jogar.seudominio.com
   ```
3. O Coolify (via Traefik embutido) gerará automaticamente o **certificado SSL gratuito (Let's Encrypt)** com renovação automática.

---

### 4. Fazer Deploy

1. Clique no botão **Deploy** no canto superior direito.
2. O Coolify executará:
   - Clonagem do repositório
   - Construção da imagem Docker baseada no `nginx:alpine`
   - Otimização e compressão Gzip dos assets de sprites e áudio
   - Inicialização do container com Healthcheck ativo em `/health`
3. Após ~30 a 60 segundos, o status mudará para 🟢 **Healthy**.

---

## 🎮 Acesso Multi-Jogador e Recursos Online

Com o jogo online no seu domínio:
1. **Acesso Universal:** Qualquer jogador no PC, Mac, Linux, Android ou iOS pode abrir o link e jogar instantaneamente com 60 FPS estáveis.
2. **Instalável como PWA:** No mobile, os jogadores podem clicar em "Adicionar à Tela de Início" para jogar em tela cheia como se fosse um app nativo.
3. **Salas Cooperativas e Ranking (Opcional - Firebase):**
   - Para que os jogadores possam se adicionar como amigos e disputar o ranking global online, basta configurar o Firebase conforme detalhado em [`docs/FIREBASE.md`](docs/FIREBASE.md).
   - O sistema de cooperação utiliza WebRTC P2P (baixo ping e sem custo de servidor para as salas).

---

## 🛠️ Deploy Manual Direto via Terminal na VPS (Alternativa sem UI)

Se preferir rodar diretamente via terminal na sua VPS usando Docker Compose:

```bash
# 1. Clone o repositório
git clone https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git
cd PokeSurvivor-Endless-Hunt

# 2. Inicie o container em background
docker compose up -d --build

# 3. Verifique se o container está saudável
docker ps
curl http://localhost/health
```

O jogo estará rodando na porta 80 da sua VPS pronto para ser mapeado pelo Nginx/Caddy ou Traefik!
