/**
 * Script para testar API de Billing do Mercado Livre
 * Testa acesso aos endpoints de períodos e perceptions
 */

const fetch = require('node-fetch');

// Configurações - você precisa obter um access token válido primeiro
const ACCESS_TOKEN = process.env.ML_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN_AQUI';

async function testBillingAPI() {
  console.log('🔍 Testando APIs de Billing do Mercado Livre\n');
  console.log('=' .repeat(60));

  // 1. Buscar lista de períodos
  console.log('\n1️⃣  Buscando períodos de faturamento...\n');
  
  try {
    const periodsUrl = 'https://api.mercadolibre.com/billing/integration/monthly/periods';
    const periodsResponse = await fetch(periodsUrl, {
      headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${periodsResponse.status} ${periodsResponse.statusText}`);

    if (!periodsResponse.ok) {
      const errorText = await periodsResponse.text();
      console.log(`❌ Erro: ${errorText}\n`);
      
      if (periodsResponse.status === 403 || periodsResponse.status === 404) {
        console.log('⚠️  API de billing não disponível para esta conta.');
        console.log('   Isso é normal para contas que não têm acesso à API de integração.\n');
      }
      return;
    }

    const periodsData = await periodsResponse.json();
    const periods = periodsData.results || [];
    
    console.log(`✅ ${periods.length} períodos encontrados\n`);

    if (periods.length === 0) {
      console.log('⚠️  Nenhum período disponível para testar.\n');
      return;
    }

    // Mostrar os 3 períodos mais recentes
    console.log('📋 Períodos mais recentes:');
    periods.slice(0, 3).forEach((period, index) => {
      console.log(`   ${index + 1}. ${period.key} - R$ ${period.amount?.toFixed(2) || '0.00'}`);
    });

    // 2. Testar endpoint de summary para o período mais recente
    const latestPeriod = periods[0];
    console.log(`\n2️⃣  Testando Summary do período: ${latestPeriod.key}\n`);

    const summaryUrl = `https://api.mercadolibre.com/billing/integration/periods/key/${latestPeriod.key}/summary?group=ML`;
    const summaryResponse = await fetch(summaryUrl, {
      headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${summaryResponse.status} ${summaryResponse.statusText}`);

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Summary obtido com sucesso\n');
      
      if (summaryData.summary?.charges) {
        console.log(`📊 Charges encontrados: ${summaryData.summary.charges.length}`);
        summaryData.summary.charges.slice(0, 5).forEach((charge, index) => {
          console.log(`   ${index + 1}. ${charge.label}: R$ ${charge.amount?.toFixed(2) || '0.00'}`);
        });
      }
    } else {
      const errorText = await summaryResponse.text();
      console.log(`❌ Erro: ${errorText}\n`);
    }

    // 3. Testar endpoint de perceptions
    console.log(`\n3️⃣  Testando Perceptions do período: ${latestPeriod.key}\n`);

    const perceptionsUrl = `https://api.mercadolibre.com/billing/integration/periods/key/${latestPeriod.key}/perceptions/summary`;
    const perceptionsResponse = await fetch(perceptionsUrl, {
      headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${perceptionsResponse.status} ${perceptionsResponse.statusText}`);

    if (perceptionsResponse.ok) {
      const perceptionsData = await perceptionsResponse.json();
      console.log('✅ Perceptions obtido com sucesso\n');
      console.log('📄 Dados recebidos:');
      console.log(JSON.stringify(perceptionsData, null, 2));
    } else {
      const errorText = await perceptionsResponse.text();
      console.log(`❌ Erro: ${errorText}\n`);
      
      if (perceptionsResponse.status === 404) {
        console.log('ℹ️  Endpoint de perceptions não disponível ou não há dados de percepções para este período.\n');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao executar teste:', error.message);
  }
}

// Verificar se o token foi fornecido
if (!process.env.ML_ACCESS_TOKEN || process.env.ML_ACCESS_TOKEN === 'SEU_ACCESS_TOKEN_AQUI') {
  console.log('❌ Access Token não configurado!\n');
  console.log('Para executar este teste:');
  console.log('1. Obtenha um access token válido do banco de dados');
  console.log('2. Execute: ML_ACCESS_TOKEN="seu_token_aqui" node test-billing-api.js\n');
  process.exit(1);
}

testBillingAPI();
