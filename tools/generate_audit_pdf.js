/**
 * Gerador de PDF Profissional para Impressão
 * Manual Técnico de Auditoria & Regras do Jogo
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const { marked } = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/marked');

const ROOT = path.join(__dirname, '..');
const MD_PATH = path.join(ROOT, 'docs', 'MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.md');
const PDF_OUTPUT_ROOT = path.join(ROOT, 'MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.pdf');
const PDF_OUTPUT_DOCS = path.join(ROOT, 'docs', 'MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.pdf');
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
const PDF_OUTPUT_ARTIFACTS = path.join(ARTIFACTS_DIR, 'MANUAL_DE_AUDITORIA_E_REGRAS_DO_JOGO.pdf');

(async () => {
  console.log('📄 Lendo arquivo markdown...');
  const mdContent = fs.readFileSync(MD_PATH, 'utf8');

  console.log('🔄 Convertendo markdown para HTML...');
  const htmlBody = marked.parse(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>PokéSurvivor: Endless Hunt — Manual de Auditoria e Regras</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

  @page {
    size: A4 portrait;
    margin: 22mm 16mm 22mm 16mm;
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Capa e Título */
  .cover-header {
    border-bottom: 3px solid #2563eb;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 20pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  h2 {
    font-size: 13pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 24px;
    margin-bottom: 12px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  p, ul, ol {
    margin: 0 0 10px 0;
  }

  ul, ol {
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  /* Tabelas Prontas para Impressão */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
    border: 1px solid #cbd5e1;
  }

  th, td {
    padding: 6px 9px;
    text-align: left;
    border: 1px solid #cbd5e1;
  }

  th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #94a3b8;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* Blocos de Código e Expressões */
  code {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    color: #0f172a;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.45;
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
  }

  pre code {
    background-color: transparent;
    padding: 0;
    border: none;
    color: inherit;
    font-size: 8pt;
  }

  /* Destaques e Caixas */
  blockquote {
    margin: 12px 0;
    padding: 8px 14px;
    background-color: #eff6ff;
    border-left: 4px solid #3b82f6;
    color: #1e40af;
    font-size: 9pt;
    page-break-inside: avoid;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }

  /* Quebras de Página Limpas */
  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>
  <div class="content">
    ${htmlBody}
  </div>
</body>
</html>`;

  console.log('🚀 Iniciando Chrome via Puppeteer para gerar PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  console.log('🖨️ Renderizando PDF tamanho A4...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: {
      top: '22mm',
      bottom: '22mm',
      left: '16mm',
      right: '16mm'
    },
    headerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: #64748b; width: 100%; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 0 16mm; display: flex; justify-content: space-between;">
        <span><strong>PokéSurvivor: Endless Hunt</strong></span>
        <span>Manual Oficial de Auditoria & Regras do Jogo</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: #64748b; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 4px; margin: 0 16mm; display: flex; justify-content: space-between;">
        <span>Documento Técnico de Referência</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `
  });

  // Salva nos destinos solicitados
  fs.writeFileSync(PDF_OUTPUT_ROOT, pdfBuffer);
  console.log('✅ PDF salvo na raiz do projeto:', PDF_OUTPUT_ROOT);

  fs.writeFileSync(PDF_OUTPUT_DOCS, pdfBuffer);
  console.log('✅ PDF salvo na pasta docs:', PDF_OUTPUT_DOCS);

  fs.writeFileSync(PDF_OUTPUT_ARTIFACTS, pdfBuffer);
  console.log('✅ PDF salvo nos artefatos:', PDF_OUTPUT_ARTIFACTS);

  await browser.close();
  console.log('🎉 Conversão para PDF concluída com total sucesso!');
  process.exit(0);
})();
