/**
 * Database Backup Script for KPDAP
 * Exports all database tables to timestamped JSON files.
 *
 * Usage:
 *   node scripts/backup-db.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if available
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
} catch (e) {
  // Ignore error if dotenv is missing or file not found
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const TABLES_TO_BACKUP = [
  'products',
  'categories',
  'orders',
  'order_items',
  'articles',
  'contact_info',
  'admin_logs',
  'admin_roles'
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('\x1b[36m%s\x1b[0m', `🚀 Starting database backup for KPDAP at ${new Date().toLocaleString()}...`);
  console.log(`Connecting to Supabase: ${SUPABASE_URL}\n`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      url: SUPABASE_URL,
      tables: {}
    },
    data: {}
  };

  for (const table of TABLES_TO_BACKUP) {
    try {
      process.stdout.write(`Backing up table \x1b[33m${table}\x1b[0m... `);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`\x1b[31mFAILED\x1b[0m (${error.message})`);
        backupData.metadata.tables[table] = { status: 'error', error: error.message };
      } else {
        const rows = data || [];
        backupData.data[table] = rows;
        backupData.metadata.tables[table] = { status: 'success', rows: rows.length };
        console.log(`\x1b[32mOK\x1b[0m (${rows.length} rows)`);
      }
    } catch (err) {
      console.log(`\x1b[31mERROR\x1b[0m (${err.message})`);
      backupData.metadata.tables[table] = { status: 'error', error: err.message };
    }
  }

  const outputFilePath = path.join(backupDir, `db-backup-${timestamp}.json`);
  const latestFilePath = path.join(backupDir, 'latest-backup.json');

  const jsonContent = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(outputFilePath, jsonContent, 'utf-8');
  fs.writeFileSync(latestFilePath, jsonContent, 'utf-8');

  const fileSizeKB = (Buffer.byteLength(jsonContent, 'utf-8') / 1024).toFixed(2);

  console.log('\n\x1b[32m%s\x1b[0m', '✅ Backup completed successfully!');
  console.log(`📁 Saved to: ${outputFilePath}`);
  console.log(`📊 Backup file size: ${fileSizeKB} KB\n`);
}

runBackup().catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', `Fatal error during backup: ${err.message}`);
  process.exit(1);
});
