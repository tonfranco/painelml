/**
 * Script para obter access token do banco de dados
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Chave de criptografia do .env.local
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '669b6ec3b9bcce0061a18ac3cf5e805d65c23559d9982f6cb8fc2ff9871a2670';

/**
 * Descriptografa um token
 */
function decryptToken(encryptedData) {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 32);
    const tag = buffer.subarray(32, 48);
    const ciphertext = buffer.subarray(48);
    
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Erro ao descriptografar: ${error.message}`);
  }
}

async function getAccessToken() {
  try {
    console.log('🔍 Buscando access token no banco de dados...\n');

    // Buscar a conta mais recente com token
    const account = await prisma.account.findFirst({
      include: {
        tokens: {
          orderBy: { obtainedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!account) {
      console.log('❌ Nenhuma conta encontrada no banco de dados.\n');
      process.exit(1);
    }

    if (!account.tokens || account.tokens.length === 0) {
      console.log('❌ Nenhum token encontrado para a conta.\n');
      process.exit(1);
    }

    const tokenRecord = account.tokens[0];
    
    console.log('✅ Conta encontrada:');
    console.log(`   Seller ID: ${account.sellerId}`);
    console.log(`   Nickname: ${account.nickname || 'N/A'}`);
    console.log(`   Token obtido em: ${tokenRecord.obtainedAt}\n`);

    // Descriptografar o token
    const accessToken = decryptToken(tokenRecord.accessToken);
    
    console.log('🔑 Access Token descriptografado com sucesso!\n');
    console.log('=' .repeat(60));
    console.log('Para testar a API de Billing, execute:\n');
    console.log(`ML_ACCESS_TOKEN="${accessToken}" node test-billing-api.js`);
    console.log('=' .repeat(60));
    console.log('\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getAccessToken();
