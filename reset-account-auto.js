/**
 * Script para limpar todos os dados de uma conta do Mercado Livre
 * VERSÃO AUTOMÁTICA - sem confirmação interativa
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: './backend/.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAccount() {
  try {
    console.log('🔄 Reset de Conta do Mercado Livre (AUTOMÁTICO)\n');
    console.log('=' .repeat(80));

    // Listar contas disponíveis
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        sellerId: true,
        nickname: true,
        createdAt: true,
        _count: {
          select: {
            tokens: true,
            items: true,
            orders: true,
            questions: true,
            billingPeriods: true,
            expenses: true,
            taxes: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (accounts.length === 0) {
      console.log('\n❌ Nenhuma conta encontrada no banco de dados.');
      console.log('\nPara conectar uma conta:');
      console.log('1. Acesse: http://localhost:4000/meli/oauth/start');
      console.log('2. Faça login no Mercado Livre');
      console.log('3. Autorize o aplicativo\n');
      process.exit(0);
    }

    console.log(`\n✅ ${accounts.length} conta(s) encontrada(s):\n`);

    const accountToDelete = accounts[0];
    
    console.log(`Account ID: ${accountToDelete.id}`);
    console.log(`Seller ID: ${accountToDelete.sellerId}`);
    console.log(`Nickname: ${accountToDelete.nickname || 'N/A'}`);
    console.log(`Criado em: ${accountToDelete.createdAt}`);
    console.log(`\nDados armazenados:`);
    console.log(`- ${accountToDelete._count.tokens} token(s)`);
    console.log(`- ${accountToDelete._count.items} produto(s)`);
    console.log(`- ${accountToDelete._count.orders} pedido(s)`);
    console.log(`- ${accountToDelete._count.questions} pergunta(s)`);
    console.log(`- ${accountToDelete._count.billingPeriods} período(s) de billing`);
    console.log(`- ${accountToDelete._count.expenses} despesa(s)`);
    console.log(`- ${accountToDelete._count.taxes} imposto(s)/taxa(s)`);

    console.log('\n' + '='.repeat(80));
    console.log(`\n🗑️  Deletando conta: ${accountToDelete.id}\n`);

    // Deletar a conta (cascade irá deletar todos os dados relacionados)
    await prisma.account.delete({
      where: { id: accountToDelete.id }
    });

    console.log('✅ Conta deletada com sucesso!\n');
    console.log('=' .repeat(80));
    console.log('\n📝 Próximos passos:\n');
    console.log('1. Acesse: http://localhost:4000/meli/oauth/start');
    console.log('   Ou: https://lives-huge-others-stopping.trycloudflare.com/meli/oauth/start');
    console.log('\n2. Faça login com sua conta do Mercado Livre');
    console.log('3. Autorize o aplicativo');
    console.log('4. Aguarde o redirecionamento');
    console.log('\n5. Execute: node get-account-id.js (para obter o novo accountId)');
    console.log('\n6. Sincronize os dados com o novo accountId:');
    console.log('   curl -X POST "http://localhost:4000/items/sync?accountId=NEW_ID"');
    console.log('   curl -X POST "http://localhost:4000/orders/sync?accountId=NEW_ID"');
    console.log('   curl -X POST "http://localhost:4000/questions/sync?accountId=NEW_ID"');
    console.log('   curl -X POST "http://localhost:4000/billing/sync?accountId=NEW_ID"');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAccount();
