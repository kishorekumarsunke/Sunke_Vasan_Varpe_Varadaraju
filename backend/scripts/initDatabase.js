import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
    let client;

    try {
        console.log('🚀 Starting database initialization...');

        // Get a client from the pool
        client = await pool.connect();

        console.log('🔄 Setting up PostgreSQL extensions...');

        // Enable PostgreSQL extensions
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await client.query('CREATE EXTENSION IF NOT EXISTS "citext";');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');

        console.log('✅ PostgreSQL extensions enabled');

        // Create migrations table to track schema changes
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Migrations table created');        // Verify setup
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('\n📊 Database setup complete!');
        console.log('🗃️  Database: TutorTogether');
        console.log('📋 Extensions and migrations table ready');
        console.log('\n📊 Current tables:');
        result.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        }); console.log('\n🎉 Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);

        if (error.code) {
            console.error('🔍 Error code:', error.code);
        }

        if (error.detail) {
            console.error('📝 Error detail:', error.detail);
        }

        process.exit(1);
    } finally {
        // Release the client back to the pool
        if (client) {
            client.release();
        }

        // Close the pool
        await pool.end();
    }
}

// Run the initialization
initializeDatabase();