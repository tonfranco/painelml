#!/usr/bin/env node

/**
 * Script para gerar PDF da documentação do Painel ML
 * 
 * Uso:
 *   node generate-pdf.js [semana]
 * 
 * Exemplos:
 *   node generate-pdf.js           # Gera PDF da semana atual (detecta automaticamente)
 *   node generate-pdf.js 2         # Gera PDF da Semana 2
 *   node generate-pdf.js 3         # Gera PDF da Semana 3
 *   node generate-pdf.js all       # Gera PDF com TODA a documentação
 * 
 * Requer:
 *   npm install -g markdown-pdf
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração de documentos por semana
const DOCS_CONFIG = {
  1: [
    'README.md',
    'SEMANA1_IMPLEMENTADO.md',
  ],
  2: [
    'SUMARIO_SEMANA2.md',
    'ENTREGA_SEMANA2.md',
    'SEMANA2_IMPLEMENTADO.md',
    'EXEMPLOS_API.md',
    'ROADMAP_VISUAL.md',
    'CHECKLIST_VALIDACAO.md',
  ],
  3: [
    'SUMARIO_SEMANA3.md',
    'ENTREGA_SEMANA3.md',
    'SEMANA3_IMPLEMENTADO.md',
    'EXEMPLOS_UI.md',
    'ROADMAP_VISUAL.md',
    'CHECKLIST_VALIDACAO.md',
  ],
  all: [
    'README_SEMANA2.md',
    'ROADMAP_VISUAL.md',
    'SUMARIO_SEMANA2.md',
    'ENTREGA_SEMANA2.md',
    'SEMANA2_IMPLEMENTADO.md',
    'EXEMPLOS_API.md',
    'CHECKLIST_VALIDACAO.md',
    'INDEX_DOCUMENTACAO.md',
  ],
};

// Detectar semana do argumento ou automaticamente
const weekArg = process.argv[2] || 'auto';
let week = weekArg;

if (weekArg === 'auto') {
  // Detectar automaticamente pela existência de arquivos
  if (fs.existsSync('SEMANA3_IMPLEMENTADO.md')) {
    week = 3;
  } else if (fs.existsSync('SEMANA2_IMPLEMENTADO.md')) {
    week = 2;
  } else {
    week = 1;
  }
  console.log(`🔍 Semana detectada automaticamente: ${week}\n`);
}

const DOCS = DOCS_CONFIG[week] || DOCS_CONFIG[2];
const OUTPUT_DIR = 'docs-pdf';
const weekLabel = week === 'all' ? 'COMPLETO' : `SEMANA${week}`;
const COMBINED_MD = path.join(OUTPUT_DIR, `${weekLabel}_COMPLETO.md`);
const OUTPUT_PDF = path.join(OUTPUT_DIR, `${weekLabel}_COMPLETO.pdf`);

console.log(`📄 Gerando PDF da Documentação - ${weekLabel}\n`);

// Criar diretório de saída
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
  console.log('✅ Diretório criado:', OUTPUT_DIR);
}

// Combinar todos os arquivos markdown
console.log('\n📝 Combinando arquivos markdown...');

const weekTitle = week === 'all' ? 'Documentação Completa' : `Documentação da Semana ${week}`;
let combinedContent = `# 📦 Painel ML - ${weekTitle}

**Data de Geração:** ${new Date().toLocaleDateString('pt-BR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

**Versão:** ${weekLabel}

---

`;

DOCS.forEach((doc, index) => {
  const filePath = path.join(__dirname, doc);
  
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${doc}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Adicionar quebra de página antes de cada documento (exceto o primeiro)
    if (index > 0) {
      combinedContent += '\n\n<div style="page-break-before: always;"></div>\n\n';
    }
    
    combinedContent += `---\n\n${content}\n\n`;
  } else {
    console.log(`  ⚠️  ${doc} não encontrado`);
  }
});

// Salvar arquivo combinado
fs.writeFileSync(COMBINED_MD, combinedContent);
console.log('\n✅ Arquivo markdown combinado criado:', COMBINED_MD);

// Gerar PDF usando markdown-pdf
console.log('\n🔄 Gerando PDF...');
console.log('   (isso pode levar alguns segundos)\n');

exec(`npx markdown-pdf "${COMBINED_MD}" -o "${OUTPUT_PDF}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    console.log('\n💡 Dica: Instale markdown-pdf globalmente:');
    console.log('   npm install -g markdown-pdf\n');
    
    // Alternativa: usar pandoc
    console.log('📌 Alternativa com Pandoc:');
    console.log(`   pandoc "${COMBINED_MD}" -o "${OUTPUT_PDF}" --pdf-engine=xelatex\n`);
    
    return;
  }
  
  if (stderr) {
    console.log('⚠️  Avisos:', stderr);
  }
  
  console.log('✅ PDF gerado com sucesso!');
  console.log(`📄 Arquivo: ${OUTPUT_PDF}`);
  
  // Estatísticas
  const stats = fs.statSync(OUTPUT_PDF);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`📊 Tamanho: ${sizeKB} KB`);
  
  console.log('\n🎉 Pronto! Abra o PDF com:');
  console.log(`   open "${OUTPUT_PDF}"\n`);
});
