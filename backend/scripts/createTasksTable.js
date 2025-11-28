import { pool } from '../config/database.js';

const createTasksTable = async () => {
  const client = await pool.connect();
  try {
    // Drop existing table if it has issues
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
    
    // Create tasks table
    await client.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        estimated_time VARCHAR(50),
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'in-progress', 'completed')),
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX idx_tasks_status ON tasks(status);
      CREATE INDEX idx_tasks_priority ON tasks(priority);
      CREATE INDEX idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX idx_tasks_created_at ON tasks(created_at);
    `);
    
    console.log('✅ Tasks table created successfully');
  } catch (error) {
    console.error('❌ Error creating tasks table:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

createTasksTable();