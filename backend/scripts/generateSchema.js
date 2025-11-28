import MigrationManager from '../src/utils/migrations.js';
import { pool } from '../config/database.js';

async function generateSchema() {
    const migrationManager = new MigrationManager();

    try {
        await migrationManager.generateSchemaFile();
        console.log('✅ Schema file generated successfully');
    } catch (error) {
        console.error('❌ Failed to generate schema:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

generateSchema();