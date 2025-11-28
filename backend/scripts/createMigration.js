import MigrationManager from '../src/utils/migrations.js';
import { pool } from '../config/database.js';

async function createMigration() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: npm run migration:create <name> <sql_content>');
        console.log('Example: npm run migration:create "add users table" "CREATE TABLE users (id UUID PRIMARY KEY);"');
        process.exit(1);
    }

    const [name, sql] = args;
    const migrationManager = new MigrationManager();

    try {
        const filename = await migrationManager.createMigration(name, sql);
        console.log(`✅ Migration created: ${filename}`);
        console.log('Run "npm run migrate" to execute pending migrations');
    } catch (error) {
        console.error('❌ Failed to create migration:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createMigration();