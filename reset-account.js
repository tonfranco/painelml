/**
 * Script para limpar todos os dados de uma conta do Mercado Livre
 * e permitir nova autenticação
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: './backend/.env.local' });

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetAccount() {
  try {
    console.log('🔄 Reset de Conta do Mercado Livre\n');
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
      rl.close();
      process.exit(0);
    }

    console.log(`\n✅ ${accounts.length} conta(s) encontrada(s):\n`);

    accounts.forEach((account, index) => {
      console.log(`${index + 1}. Account ID: ${account.id}`);
      console.log(`   Seller ID: ${account.sellerId}`);
      console.log(`   Nickname: ${account.nickname || 'N/A'}`);
      console.log(`   Criado em: ${account.createdAt}`);
      console.log(`   Dados armazenados:`);
      console.log(`   - ${account._count.tokens} token(s)`);
      console.log(`   - ${account._count.items} produto(s)`);
      console.log(`   - ${account._count.orders} pedido(s)`);
      console.log(`   - ${account._count.questions} pergunta(s)`);
      console.log(`   - ${account._count.billingPeriods} período(s) de billing`);
      console.log(`   - ${account._count.expenses} despesa(s)`);
      console.log(`   - ${account._count.taxes} imposto(s)/taxa(s)`);
      console.log('');
    });

    console.log('=' .repeat(80));

    // Confirmar ação
    const confirm = await question('\n⚠️  ATENÇÃO: Esta ação irá DELETAR TODOS os dados desta conta!\n\nDeseja continuar? (digite "SIM" para confirmar): ');

    if (confirm.trim().toUpperCase() !== 'SIM') {
      console.log('\n❌ Operação cancelada pelo usuário.\n');
      rl.close();
      process.exit(0);
    }

    // Selecionar conta (se houver mais de uma)
    let accountToDelete = accounts[0];
    
    if (accounts.length > 1) {
      const choice = await question(`\nQual conta deseja resetar? (1-${accounts.length}): `);
      const index = parseInt(choice) - 1;
      
      if (index < 0 || index >= accounts.length) {
        console.log('\n❌ Opção inválida.\n');
        rl.close();
        process.exit(1);
      }
      
      accountToDelete = accounts[index];
    }

    console.log(`\n🗑️  Deletando conta: ${accountToDelete.id}\n`);

    // Deletar a conta (cascade irá deletar todos os dados relacionados)
    await prisma.account.delete({
      where: { id: accountToDelete.id }
    });

    console.log('✅ Conta deletada com sucesso!\n');
    console.log('=' .repeat(80));
    console.log('\n📝 Próximos passos:\n');
    console.log('1. Acesse: http://localhost:4000/meli/oauth/start');
    console.log('2. Faça login com sua conta do Mercado Livre');
    console.log('3. Autorize o aplicativo');
    console.log('4. Aguarde o redirecionamento');
    console.log('5. Execute: node get-account-id.js (para obter o novo accountId)');
    console.log('6. Sincronize os dados:');
    console.log('   - Produtos: curl -X POST "http://localhost:4000/items/sync?accountId=NEW_ID"');
    console.log('   - Pedidos: curl -X POST "http://localhost:4000/orders/sync?accountId=NEW_ID"');
    console.log('   - Perguntas: curl -X POST "http://localhost:4000/questions/sync?accountId=NEW_ID"');
    console.log('   - Billing: curl -X POST "http://localhost:4000/billing/sync?accountId=NEW_ID"');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

resetAccount();
