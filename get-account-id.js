/**
 * Script para obter o accountId do banco de dados
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: './backend/.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAccountId() {
  try {
    console.log('🔍 Buscando contas no banco de dados...\n');

    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        sellerId: true,
        nickname: true,
        siteId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (accounts.length === 0) {
      console.log('❌ Nenhuma conta encontrada no banco de dados.');
      console.log('\nPara conectar uma conta:');
      console.log('1. Acesse: http://localhost:4000/meli/oauth/start');
      console.log('2. Faça login no Mercado Livre');
      console.log('3. Autorize o aplicativo\n');
      process.exit(1);
    }

    console.log(`✅ ${accounts.length} conta(s) encontrada(s):\n`);
    console.log('=' .repeat(80));

    accounts.forEach((account, index) => {
      console.log(`\n${index + 1}. Account ID: ${account.id}`);
      console.log(`   Seller ID: ${account.sellerId}`);
      console.log(`   Nickname: ${account.nickname || 'N/A'}`);
      console.log(`   Site ID: ${account.siteId || 'N/A'}`);
      console.log(`   Criado em: ${account.createdAt}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Para usar nos comandos curl, use o Account ID:\n');
    console.log(`   Account ID: ${accounts[0].id}`);
    console.log('\nExemplo:');
    console.log(`   curl -X POST "http://localhost:4000/billing/sync?accountId=${accounts[0].id}"`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getAccountId();
