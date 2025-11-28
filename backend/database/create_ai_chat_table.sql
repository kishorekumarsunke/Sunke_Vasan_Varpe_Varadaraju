-- Create ai_chat_messages table to store user conversations with AI
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user_id and timestamp
CREATE INDEX idx_ai_chat_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_created_at ON ai_chat_messages(created_at DESC);
CREATE INDEX idx_ai_chat_user_created ON ai_chat_messages(user_id, created_at DESC);

-- Add comment to table
COMMENT ON TABLE ai_chat_messages IS 'Stores conversation history between users and the AI assistant';
COMMENT ON COLUMN ai_chat_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN ai_chat_messages.message IS 'The actual message content';
