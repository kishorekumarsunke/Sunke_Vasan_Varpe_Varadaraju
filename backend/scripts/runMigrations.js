import MigrationManager from '../src/utils/migrations.js';
import { pool } from '../config/database.js';

async function runMigrations() {
    const migrationManager = new MigrationManager();

    try {
        await migrationManager.runMigrations();
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();