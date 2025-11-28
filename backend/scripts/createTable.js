import MigrationManager from '../src/utils/migrations.js';
import { pool } from '../config/database.js';

/**
 * Helper script to create common table types with standard patterns
 */

const tableTemplates = {
    accounts: `
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT UNIQUE NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT,
    phone_number TEXT,
    bio TEXT,
    location_city TEXT,
    location_country TEXT,
    profile_image TEXT
);

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_location ON accounts(location_city, location_country);`,


    sessions: `
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_duration CHECK (duration_minutes IN (30, 45, 60, 90, 120)),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT different_participants CHECK (student_id != tutor_id)
);

CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_tutor ON sessions(tutor_id);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON sessions(status);`,

    messages: `
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;`
};

async function createTableMigration() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: npm run table:create <table_type>');
        console.log('\nAvailable table types:');
        Object.keys(tableTemplates).forEach(type => {
            console.log(`  • ${type}`);
        });
        console.log('\nExample: npm run table:create accounts');
        process.exit(1);
    }

    const [tableType] = args;

    if (!tableTemplates[tableType]) {
        console.error(`❌ Unknown table type: ${tableType}`);
        console.log('\nAvailable table types:');
        Object.keys(tableTemplates).forEach(type => {
            console.log(`  • ${type}`);
        });
        process.exit(1);
    }

    const migrationManager = new MigrationManager();

    try {
        const sql = tableTemplates[tableType].trim();
        const filename = await migrationManager.createMigration(`create ${tableType} table`, sql);

        console.log(`✅ Created ${tableType} table migration: ${filename}`);
        console.log('📋 Migration includes:');

        // Show what's included
        const lines = sql.split('\n').filter(line => line.trim().startsWith('CREATE'));
        lines.forEach(line => {
            const match = line.match(/CREATE (\w+) (\w+)/);
            if (match) {
                console.log(`   • ${match[1]}: ${match[2]}`);
            }
        });

        console.log('\n🚀 Run "npm run migrate" to apply the migration');

    } catch (error) {
        console.error('❌ Failed to create migration:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createTableMigration();