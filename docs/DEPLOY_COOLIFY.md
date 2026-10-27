# 🚀 Guia de Deploy no Coolify (VPS) — PokéSurvivor

Este guia detalha o passo a passo completo para colocar o **PokéSurvivor** online na VPS
utilizando o **Coolify**, permitindo que qualquer pessoa acesse e jogue diretamente pelo
navegador (desktop e mobile).

> [!IMPORTANT]
> **O deploy desta aplicação é MANUAL.** O repositório `cardoso-ix/PokeSurvivor-Endless-Hunt`
> **não tem webhook do GitHub registrado** — `gh api repos/cardoso-ix/PokeSurvivor-Endless-Hunt/hooks`
> devolve `[]`. Portanto `git push origin main` **não** publica sozinho: é preciso acionar
> o deploy por um dos três caminhos da seção [Disparar o deploy](#disparar-o-deploy).
>
> Consequência prática: se você fez push e o site não mudou, **não é bug** — o deploy
> simplesmente não foi acionado. Use `node tools/wait_for_vps_deploy.js` para conferir
> qual versão está no ar.

---

## 📋 Pré-Requisitos

1. **VPS com Coolify instalado** (Hetzner, DigitalOcean, Linode, AWS, Oracle Cloud ou qualquer servidor Linux com Docker).
2. **Repositório Git** (GitHub, GitLab ou repositório público/privado).
3. **Domínio ou Subdomínio apontado para o IP da sua VPS** (ex: `jogar.seudominio.com`).

---

## 🔑 Dados da instância atual

| Item | Valor |
|---|---|
| IP da VPS | `108.174.145.77` |
| Painel do Coolify | `http://108.174.145.77:8000` |
| Healthcheck da API | `http://108.174.145.77:8000/api/health` → `200 OK` |
| Repositório | `https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git` |
| Branch | `main` |
| App UUID (Coolify) | `zewmdvru0kg4xpqqttxflf7a` |
| Project UUID | `sbj4ivuka9bkj1sgq0btyk4f` |
| Environment UUID | `dxg1tdqtfbz0oeke0iows7yd` |
| URL público (sslip.io) | `http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/` |

> O `app UUID` é o mesmo prefixo do subdomínio `sslip.io`: o Coolify gera o host a
> partir do UUID da aplicação.

### Portas em uso na VPS

| Porta | Servição |
|---|---|
| `80` | Nginx/Traefik — o jogo (domínio e `sslip.io`) |
| `8000` | Painel do Coolify + API |
| `3000` | Container do jogo (acesso direto, protegido por autenticação) |
| `443` | TLS sem certificado válido (o domínio final usa o proxy do Coolify) |

---

## ⚡ Configuração inicial no Coolify

### 1. Criar o Recurso

1. Acesse o painel (ex: `http://108.174.145.77:8000`).
2. **+ New Resource** → **Public Repository**.
3. URL: `https://github.com/cardoso-ix/PokeSurvivor-Endless-Hunt.git`
4. Branch: `main`

### 2. Tipo de Build

- **Build Pack:** **Dockerfile** (o `docker-compose.yml` também funciona).
- **Port:** `80`.

### 3. Domínio e SSL

Em **General → Domains**, informe o domínio completo com protocolo:

```
https://jogar.seudominio.com
```

O Traefik embutido do Coolify gera o certificado SSL gratuito (Let's Encrypt) com
renovação automática.

### 4. Fazer Deploy

Clique em **Deploy**. O Coolify executa:

- Clonagem do repositório
- Build da imagem Docker sobre `nginx:alpine`
- Otimização e compressão Gzip dos assets de sprites e áudio
- Inicialização do container com Healthcheck ativo em `/health`

Após ~30 a 60 segundos o status muda para 🟢 **Healthy**.

---

## 🚀 Disparar o deploy

Escolha **um** dos três caminhos. Todos produzem o mesmo resultado.

### Caminho A — Painel (mais simples)

1. Abra `http://108.174.145.77:8000`.
2. **Project** → **Ambiente** (`production`) → aplicação `poke-survivor--endless--hunt`.
3. Clique em **Deploy** no canto superior direito.

### Caminho B — Webhook de deploy (bom para CI)

No painel: **Automation → Webhooks → Deploy webhook**. O campo *Secret Key* só é
exibido no momento em que é gerado — o Coolify **nunca** o renderiza depois. Copie-o
imediatamente e guarde num local seguro.

```bash
curl -X POST "http://108.174.145.77:8000/deploy/webhook/<SEGREDO>"
```

> Sem o segredo correto a resposta é a página de login do painel, não um erro 401 —
> o Coolify não distingue "segredo inválido" de "rota desconhecida". Se receber HTML,
> o segredo está errado.

### Caminho C — API do Coolify (bom para automação)

Crie um token em **Profile → API Tokens** e use-o como *Bearer*:

```bash
curl -X POST "http://108.174.145.77:8000/api/v1/deploy?uuid=zewmdvru0kg4xpqqttxflf7a" \
  -H "Authorization: Bearer <TOKEN_API>"
```

A API exige autenticação: sem token, `/api/v1/applications` responde `401`.

> [!NOTE]
> **Segredos:** o segredo do webhook e o token da API **não** devem ser commitados no
> repositório nem guardados em arquivos de texto. Guarde no gerenciador de segredos do
> GitHub (`gh secret set`) ou na variável de ambiente da sua ferramenta de CI.

---

## ✅ Verificar se o deploy funcionou

```bash
# 1. Aguarda a versão alvo aparecer no ar (60 tentativas × 4 s)
node tools/wait_for_vps_deploy.js <hash-em-hex>

# 2. Valida a aplicação completa no navegador real
node tools/verify_vps_deploy.js
```

O `version.json` publicado é a "impressão digital" da versão:

```json
{"v":"27673a1904","at":"2026-10-27T00:12:06.503Z"}
```

O campo `v` é o hash do build gerado por `tools/build.js`; `at` é a data/hora da
publicação. Compare com o `version.json` local — se divergirem, o deploy não rodou
ou rodou uma versão antiga.

---

## 🎮 Acesso Multi-Jogador e Recursos Online

1. **Acesso Universal:** qualquer jogador em PC, Mac, Linux, Android ou iOS abre o link e joga instantaneamente a 60 FPS estáveis.
2. **Instalável como PWA:** no mobile, "Adicionar à Tela de Início" joga em tela cheia como app nativo.
3. **Salas Cooperativas e Ranking (Firebase):** ver [`docs/FIREBASE.md`](FIREBASE.md). O cooperativo usa WebRTC P2P (sem custo de servidor para as salas).

---

## 🛠️ Deploy Manual Direto via Terminal (Alternativa sem UI)

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

O jogo roda na porta `80` da VPS, pronto para ser mapeado pelo Nginx/Caddy/Traefik.

---

## ⚠️ Diagnóstico: o site não atualizou depois do push

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `version.json` no ar está velho | Deploy não foi acionado (o caso mais comum) | Caminho A, B ou C acima |
| `version.json` no ar tem a versão nova mas o jogo parece antigo | Cache do navegador ou do Service Worker | `js/core/updater.js` checa `version.json` a cada 5 min; force com <kbd>Ctrl</kbd>+<kbd>F5</kbd> |
| Painel do Coolify mostra erro de build | `Dockerfile`/`nginx.conf` quebrados | Rode `docker compose up -d --build` local e corrija antes de reenviar |
| `401` ao chamar a API do Coolify | Token ausente ou inválido | Use `Authorization: Bearer <TOKEN>` |

---

## 🔗 Sobre o domínio `pokesurvivor.com`

O domínio `pokesurvivor.com` **não** é servido por esta VPS. Ele aponta para
**GitHub Pages**, e o repositório que o serve é outro, com base de código distinta e
evolução própria (multilingue, evento de Halloween, Firebase). Ver
[`docs/DOMINIO.md`](DOMINIO.md) e [`docs/PUBLICAR.md`](PUBLICAR.md).

---

## 📚 Documentos relacionados

- [`docs/PUBLICAR.md`](PUBLICAR.md) — publicação no GitHub Pages
- [`docs/DOMINIO.md`](DOMINIO.md) — configuração de `pokesurvivor.com`
- [`docs/SEO.md`](SEO.md) — páginas de SEO e indexação
- [`docs/FIREBASE.md`](FIREBASE.md) — contas, ranking e cooperativo
- [`docs/MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.md`](MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.md) — regras, números e auditoria do balanceamento
