import bcrypt from 'bcryptjs';
import { pool } from './config/database.js';

async function createAdminAccount() {
    try {
        console.log('🔧 Creating admin account and updating schema...\n');

        // Step 1: Add approval fields to tutor_profiles if they don't exist
        console.log('📋 Updating tutor_profiles table schema...');
        await pool.query(`
            DO $$ 
            BEGIN
                -- Add approval_status column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tutor_profiles' AND column_name = 'approval_status'
                ) THEN
                    ALTER TABLE tutor_profiles 
                    ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
                    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
                    
                    -- Set existing tutors as approved
                    UPDATE tutor_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;
                END IF;

                -- Add admin_notes column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tutor_profiles' AND column_name = 'admin_notes'
                ) THEN
                    ALTER TABLE tutor_profiles ADD COLUMN admin_notes TEXT;
                END IF;

                -- Add approved_at column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tutor_profiles' AND column_name = 'approved_at'
                ) THEN
                    ALTER TABLE tutor_profiles ADD COLUMN approved_at TIMESTAMP;
                END IF;

                -- Add approved_by column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tutor_profiles' AND column_name = 'approved_by'
                ) THEN
                    ALTER TABLE tutor_profiles ADD COLUMN approved_by UUID REFERENCES accounts(id);
                END IF;
            END $$;
        `);
        console.log('✅ Schema updated successfully!\n');

        // Step 2: Check if admin account already exists
        const existingAdmin = await pool.query(
            'SELECT id, email FROM accounts WHERE email = $1',
            ['admin@demo.com']
        );

        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Admin account already exists!');
            console.log('   Email: admin@demo.com');
            console.log('   ID:', existingAdmin.rows[0].id);
            console.log('\n   To reset password, delete the account first.');
            return;
        }

        // Step 3: Create admin account
        console.log('👤 Creating admin account...');
        const passwordHash = await bcrypt.hash('Demo1234', 12);

        const result = await pool.query(`
            INSERT INTO accounts (
                username, 
                email, 
                password_hash, 
                account_type, 
                full_name,
                is_active, 
                email_verified
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, username, email, account_type, full_name, created_at
        `, [
            'admin',
            'admin@demo.com',
            passwordHash,
            'admin',
            'System Administrator',
            true,
            true
        ]);

        const admin = result.rows[0];

        console.log('✅ Admin account created successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📧 Email:        admin@demo.com');
        console.log('🔑 Password:     Demo1234');
        console.log('👤 Full Name:    System Administrator');
        console.log('🆔 ID:          ', admin.id);
        console.log('📅 Created:     ', admin.created_at);
        console.log('═══════════════════════════════════════════\n');

        console.log('✨ Admin setup complete!');
        console.log('   You can now log in with the credentials above.\n');

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

createAdminAccount();
