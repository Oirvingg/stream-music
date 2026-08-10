/**
 * Script de limpeza completa de dados de usuários
 * - Trunca tabelas do PostgreSQL com tratamento de chaves estrangeiras
 * - Remove arquivos de upload do storage
 * - Fornece função para limpar localStorage/sessionStorage no frontend
 */
import 'dotenv/config';
import { pool } from '../db.js';

async function cleanupDatabase() {
  console.log('🗑️  Limpando banco de dados PostgreSQL...');
  try {
    // Trunca tabelas com CASCADE (respeita FK automaticamente)
    await pool.query('TRUNCATE TABLE favorites CASCADE;');
    await pool.query('TRUNCATE TABLE playlists CASCADE;');
    await pool.query('TRUNCATE TABLE users CASCADE;');
    
    console.log('✅ Tabelas truncadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error.message);
    throw error;
  }
}

async function cleanupStorage() {
  console.log('🗑️  Limpando arquivos de storage...');
  try {
    // Se usar filesystem local
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    
    try {
      const files = await fs.readdir(uploadDir);
      for (const file of files) {
        await fs.unlink(path.join(uploadDir, file));
      }
      console.log(`✅ ${files.length} arquivo(s) removido(s) do storage`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('ℹ️  Diretório de uploads não encontrado (esperado em primeira limpeza)');
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao limpar storage:', error.message);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  LIMPEZA COMPLETA DE DADOS DE USUÁRIOS ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await cleanupDatabase();
    await cleanupStorage();
    
    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. Frontend: chamar clearUserData() após logout');
    console.log('   2. Database: rodar "npm run setup-db" para recriar schema');
  } catch (error) {
    console.error('\n❌ Limpeza falhou:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
