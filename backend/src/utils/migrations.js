import { pool } from '../../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration system for Tutor Together
 * Handles schema changes and tracks them for consistency
 */
class MigrationManager {
    constructor() {
        this.migrationsPath = path.join(__dirname, '../migrations');
        this.schemaPath = path.join(__dirname, '../../docs');
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        const client = await pool.connect();

        try {
            console.log('📋 Checking for pending migrations...');

            // Ensure migrations directory exists
            if (!fs.existsSync(this.migrationsPath)) {
                fs.mkdirSync(this.migrationsPath, { recursive: true });
                console.log('📁 Created migrations directory');
            }

            // Get executed migrations
            const executedResult = await client.query(
                'SELECT name FROM migrations ORDER BY executed_at'
            );
            const executedMigrations = executedResult.rows.map(row => row.name);

            // Get all migration files
            const migrationFiles = fs.readdirSync(this.migrationsPath)
                .filter(file => file.endsWith('.sql'))
                .sort();

            // Find pending migrations
            const pendingMigrations = migrationFiles.filter(
                file => !executedMigrations.includes(file)
            );

            if (pendingMigrations.length === 0) {
                console.log('✅ No pending migrations found');
                return;
            }

            console.log(`🔄 Running ${pendingMigrations.length} migration(s)...`);

            // Execute pending migrations
            for (const migrationFile of pendingMigrations) {
                await this.executeMigration(client, migrationFile);
            }

            // Update schema file
            await this.generateSchemaFile();

            console.log('🎉 All migrations completed successfully!');

        } finally {
            client.release();
        }
    }

    /**
     * Execute a single migration
     */
    async executeMigration(client, migrationFile) {
        const migrationPath = path.join(this.migrationsPath, migrationFile);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        try {
            await client.query('BEGIN');

            console.log(`⚡ Executing migration: ${migrationFile}`);

            // Execute the migration
            await client.query(migrationSQL);

            // Record the migration
            await client.query(
                'INSERT INTO migrations (name) VALUES ($1)',
                [migrationFile]
            );

            await client.query('COMMIT');
            console.log(`✅ Migration completed: ${migrationFile}`);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Migration failed: ${migrationFile}`);
            throw error;
        }
    }

    /**
     * Create a new migration file
     */
    async createMigration(name, sql) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filepath = path.join(this.migrationsPath, filename);

        // Ensure migrations directory exists
        if (!fs.existsSync(this.migrationsPath)) {
            fs.mkdirSync(this.migrationsPath, { recursive: true });
        }

        // Add migration header
        const migrationContent = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: ${name}

${sql}
`;

        fs.writeFileSync(filepath, migrationContent);
        console.log(`📝 Created migration: ${filename}`);

        return filename;
    }

    /**
     * Generate current schema file for documentation/cloning
     */
    async generateSchemaFile() {
        const client = await pool.connect();

        try {
            console.log('📄 Generating current schema file...');

            // Get all tables and their definitions
            const tablesResult = await client.query(`
                SELECT table_name as tablename 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);

            let schemaSQL = `-- Tutor Together Database Schema
-- Generated: ${new Date().toISOString()}
-- This file is auto-generated. Do not edit manually.

-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

`;

            // Generate CREATE TABLE statements for each table
            for (const table of tablesResult.rows) {
                if (table.tablename === 'migrations') continue; // Skip migrations table

                const createTableResult = await client.query(`
                    SELECT 
                        'CREATE TABLE ' || table_name || ' (' ||
                        array_to_string(
                            array_agg(
                                column_name || ' ' || data_type ||
                                CASE 
                                    WHEN character_maximum_length IS NOT NULL 
                                    THEN '(' || character_maximum_length || ')'
                                    ELSE ''
                                END ||
                                CASE 
                                    WHEN is_nullable = 'NO' THEN ' NOT NULL'
                                    ELSE ''
                                END ||
                                CASE 
                                    WHEN column_default IS NOT NULL 
                                    THEN ' DEFAULT ' || column_default
                                    ELSE ''
                                END
                            ), 
                            ', '
                        ) || ');' as create_statement
                    FROM information_schema.columns 
                    WHERE table_schema = $1 AND table_name = $2
                    GROUP BY table_name
                `, ['public', table.tablename]);

                if (createTableResult.rows.length > 0) {
                    schemaSQL += `\n-- Table: ${table.tablename}\n`;
                    schemaSQL += createTableResult.rows[0].create_statement + '\n';
                }
            }

            // Ensure docs directory exists
            if (!fs.existsSync(this.schemaPath)) {
                fs.mkdirSync(this.schemaPath, { recursive: true });
            }

            // Write schema file
            const schemaFilePath = path.join(this.schemaPath, 'current_schema.sql');
            fs.writeFileSync(schemaFilePath, schemaSQL);

            console.log(`✅ Schema file generated: ${schemaFilePath}`);

        } finally {
            client.release();
        }
    }

    /**
     * Get migration status
     */
    async getStatus() {
        const client = await pool.connect();

        try {
            const executedResult = await client.query(
                'SELECT name, executed_at FROM migrations ORDER BY executed_at DESC'
            );

            console.log('\n📊 Migration Status:');
            if (executedResult.rows.length === 0) {
                console.log('   No migrations executed yet');
            } else {
                executedResult.rows.forEach(row => {
                    console.log(`   ✅ ${row.name} (${row.executed_at.toISOString()})`);
                });
            }

        } finally {
            client.release();
        }
    }
}

export default MigrationManager;