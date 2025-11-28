--
-- TutorTogether Database Schema
-- PostgreSQL Schema Definition (Tables, Functions, Indexes, Constraints)
-- No data included - structure only
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update tutor rating after review changes
CREATE OR REPLACE FUNCTION update_tutor_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update tutor_profiles with new aggregated rating data
    UPDATE tutor_profiles 
    SET 
        rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE account_id = COALESCE(NEW.tutor_id, OLD.tutor_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- TABLES
-- =====================================================

-- Migrations tracking table
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (main user table)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT NOT NULL UNIQUE,
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT,
    phone_number TEXT,
    bio TEXT,
    location_city TEXT,
    location_state TEXT,
    profile_image TEXT,
    status VARCHAR(20) DEFAULT 'offline'
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    FOREIGN KEY (sender_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Student profiles table
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE,
    current_school TEXT,
    graduation_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bio TEXT,
    grade_level VARCHAR(20),
    subjects_of_interest TEXT[],
    learning_goals TEXT,
    total_sessions INTEGER DEFAULT 0,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Tutor profiles table
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE,
    hourly_rate NUMERIC(6,2),
    subjects_taught TEXT[],
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bio TEXT,
    rating NUMERIC(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    response_time_avg INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    available_days TEXT[] DEFAULT '{}',
    approval_status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    approved_by UUID,
    CONSTRAINT tutor_profiles_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES accounts(id)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    estimated_time VARCHAR(50),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'started', 'in-progress', 'completed')),
    CONSTRAINT tasks_progress_check CHECK (progress >= 0 AND progress <= 100),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'academic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor availability table
CREATE TABLE tutor_availability (
    id SERIAL PRIMARY KEY,
    tutor_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    hourly_rate NUMERIC(10,2) NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    booking_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tutor_id, date, start_time),
    FOREIGN KEY (tutor_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    tutor_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    subject VARCHAR(100) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    meeting_type VARCHAR(20) NOT NULL,
    location TEXT,
    hourly_rate NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    student_notes TEXT,
    tutor_notes TEXT,
    session_notes TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    tutor_response_message TEXT,
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    review_submitted BOOLEAN DEFAULT false,
    review_submitted_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'rejected')),
    FOREIGN KEY (student_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Add foreign key for tutor_availability.booking_id (must be after bookings table creation)
ALTER TABLE tutor_availability 
    ADD CONSTRAINT fk_tutor_availability_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    student_id UUID NOT NULL,
    tutor_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT true,
    session_quality_rating INTEGER,
    communication_rating INTEGER,
    punctuality_rating INTEGER,
    helpfulness_rating INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT reviews_session_quality_rating_check CHECK (session_quality_rating >= 1 AND session_quality_rating <= 5),
    CONSTRAINT reviews_communication_rating_check CHECK (communication_rating >= 1 AND communication_rating <= 5),
    CONSTRAINT reviews_punctuality_rating_check CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    CONSTRAINT reviews_helpfulness_rating_check CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- AI chat messages table
CREATE TABLE ai_chat_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_chat_messages_role_check CHECK (role IN ('user', 'assistant', 'system')),
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

COMMENT ON TABLE ai_chat_messages IS 'Stores conversation history between users and the AI assistant';
COMMENT ON COLUMN ai_chat_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN ai_chat_messages.message IS 'The actual message content';

-- =====================================================
-- INDEXES
-- =====================================================

-- Accounts indexes
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_type ON accounts(account_type);

-- Messages indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Student profiles indexes
CREATE UNIQUE INDEX idx_student_profiles_account ON student_profiles(account_id);
CREATE INDEX idx_student_profiles_school ON student_profiles(current_school);

-- Tutor profiles indexes
CREATE UNIQUE INDEX idx_tutor_profiles_account ON tutor_profiles(account_id);
CREATE INDEX idx_tutor_profiles_verified ON tutor_profiles(is_verified);
CREATE INDEX idx_tutor_profiles_rate ON tutor_profiles(hourly_rate);
CREATE INDEX idx_tutor_profiles_subjects ON tutor_profiles USING gin(subjects_taught);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Subjects indexes
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_subjects_category ON subjects(category);

-- Tutor availability indexes
CREATE INDEX idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX idx_tutor_availability_date ON tutor_availability(date);
CREATE INDEX idx_tutor_availability_is_booked ON tutor_availability(is_booked);

-- Bookings indexes
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_tutor_id ON bookings(tutor_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Reviews indexes
CREATE INDEX idx_reviews_tutor_id ON reviews(tutor_id);
CREATE INDEX idx_reviews_student_id ON reviews(student_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- AI chat messages indexes
CREATE INDEX idx_ai_chat_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_created_at ON ai_chat_messages(created_at DESC);
CREATE INDEX idx_ai_chat_user_created ON ai_chat_messages(user_id, created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update tutor rating on review insert
CREATE TRIGGER trigger_update_tutor_rating_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

-- Trigger to update tutor rating on review update
CREATE TRIGGER trigger_update_tutor_rating_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

-- Trigger to update tutor rating on review delete
CREATE TRIGGER trigger_update_tutor_rating_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

-- =====================================================
-- COMPLETED
-- =====================================================
-- Schema creation complete
-- You can now use this database structure
