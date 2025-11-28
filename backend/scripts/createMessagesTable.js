import { pool } from '../config/database.js';

const createMessagesTable = async () => {
  const client = await pool.connect();
  try {
    // Drop existing table if it has issues
    await client.query(`DROP TABLE IF EXISTS messages CASCADE;`);
    
    // Create messages table
    await client.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        recipient_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX idx_messages_sender ON messages(sender_id);
      CREATE INDEX idx_messages_recipient ON messages(recipient_id);  
      CREATE INDEX idx_messages_created_at ON messages(created_at);
      CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id);
    `);
    
    console.log('✅ Messages table created successfully');
  } catch (error) {
    console.error('❌ Error creating messages table:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

createMessagesTable();