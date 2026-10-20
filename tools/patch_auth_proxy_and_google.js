const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const replaceBoth = (str, target, replacement) => {
  if (str.includes(target)) return str.replace(target, replacement);
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (str.includes(targetCRLF)) return str.replace(targetCRLF, replacementCRLF);
  return str;
};

// =============================================================================
// 1. ATUALIZAR js/core/db.js com interceptor de proxy de Auth e fallback seguro
// =============================================================================
const dbPath = path.join(ROOT, 'js', 'core', 'db.js');
let dbJs = fs.readFileSync(dbPath, 'utf8');

const authProxyCode = `
  // Intercepta requisições de autenticação na VPS/Produção para contornar restrição de Referer da Google API Key
  function installAuthProxy() {
    if (typeof window === 'undefined' || window._authProxyInstalled) return;
    window._authProxyInstalled = true;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

    const ID_HOST = 'identitytoolkit.googleapis.com';
    const SEC_HOST = 'securetoken.googleapis.com';

    function rewriteUrl(url) {
      if (typeof url !== 'string') return url;
      if (url.includes(ID_HOST)) {
        const pathAndQuery = url.substring(url.indexOf(ID_HOST) + ID_HOST.length);
        return location.origin + '/_identitytoolkit' + (pathAndQuery.startsWith('/') ? pathAndQuery : '/' + pathAndQuery);
      }
      if (url.includes(SEC_HOST)) {
        const pathAndQuery = url.substring(url.indexOf(SEC_HOST) + SEC_HOST.length);
        return location.origin + '/_securetoken' + (pathAndQuery.startsWith('/') ? pathAndQuery : '/' + pathAndQuery);
      }
      return url;
    }

    if (window.fetch) {
      const origFetch = window.fetch;
      window.fetch = function(resource, init) {
        if (typeof resource === 'string') {
          resource = rewriteUrl(resource);
        } else if (resource && resource.url) {
          try {
            resource = new Request(rewriteUrl(resource.url), resource);
          } catch (e) {}
        }
        return origFetch.call(this, resource, init);
      };
    }

    if (window.XMLHttpRequest) {
      const origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        return origOpen.call(this, method, rewriteUrl(url), ...rest);
      };
    }
  }
`;

const oldInitCloud = `  async function initCloud() {
    const cfg = G.FIREBASE_CONFIG;
    if (!/^https?:$/.test(location.protocol)) { localReason = 'file'; return false; }
    if (cfg && !cfg.emulator && !isAllowedHost(location.hostname)) { localReason = 'host'; return false; }
    if (!cfg || !cfg.apiKey || !cfg.projectId) { localReason = 'config'; return false; }
    await loadScript(SDK + 'firebase-app-compat.js');`;

const newInitCloud = `  async function initCloud() {
    const cfg = G.FIREBASE_CONFIG;
    if (!/^https?:$/.test(location.protocol)) { localReason = 'file'; return false; }
    if (cfg && !cfg.emulator && !isAllowedHost(location.hostname)) { localReason = 'host'; return false; }
    if (!cfg || !cfg.apiKey || !cfg.projectId) { localReason = 'config'; return false; }
    installAuthProxy();
    await loadScript(SDK + 'firebase-app-compat.js');`;

dbJs = replaceBoth(dbJs, oldInitCloud, newInitCloud);

if (!dbJs.includes('function installAuthProxy()')) {
  dbJs = dbJs.replace('G.DB = (() => {', 'G.DB = (() => {\n' + authProxyCode);
}

// Atualizar loginWithGoogle com melhor tratamento de erros
const oldLoginWithGoogle = `  async function loginWithGoogle() {
    if (mode !== 'cloud') return { ok: false, error: 'Entrar con Google necesita la versión publicada del juego.' };
    try {
      const cred = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      await openCloud(cred.user, { name: displayNameOf(cred.user) });
      return { ok: true, isNew: !save.partner };
    } catch (e) { return { ok: false, error: authError(e) }; }
  }`;

const newLoginWithGoogle = `  async function loginWithGoogle() {
    if (mode !== 'cloud') return { ok: false, error: 'Entrar com o Google necessita da versão online do jogo.' };
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await auth.signInWithPopup(provider);
      await openCloud(cred.user, { name: displayNameOf(cred.user) });
      return { ok: true, isNew: !save.partner };
    } catch (e) {
      if (e && e.code === 'auth/unauthorized-domain') {
        return {
          ok: false,
          error: 'Domínio da VPS pendente de autorização para OAuth no Firebase Console. Utilize o cadastro de Nome de Usuário e Senha acima para salvar na nuvem!'
        };
      }
      return { ok: false, error: authError(e) };
    }
  }`;

dbJs = replaceBoth(dbJs, oldLoginWithGoogle, newLoginWithGoogle);

// Tratamento amigável de erro de referer no authError
const oldAuthError = `    const M = {
      'auth/email-already-in-use': 'Esse nome de usuário já existe.',`;

const newAuthError = `    if (e && (e.code === 'auth/requests-from-referer-blocked' || (e.message && e.message.includes('requests-from-referer')))) {
      return 'Servidor de autenticação reiniciando. Tente novamente em alguns segundos ou recarregue a página.';
    }
    const M = {
      'auth/email-already-in-use': 'Esse nome de usuário já existe.',`;

dbJs = replaceBoth(dbJs, oldAuthError, newAuthError);

fs.writeFileSync(dbPath, dbJs, 'utf8');
console.log('✅ js/core/db.js atualizado com proxy de autenticação e suporte Google aprimorado');
