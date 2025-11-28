--
-- TutorTogether Database Schema with Mock Data
-- PostgreSQL Schema Definition + Sample Data
-- Includes DROP statements to clean existing tables
-- Includes realistic test data for development and testing
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
-- DROP EXISTING TABLES (in reverse dependency order)
-- =====================================================

DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tutor_availability CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS tutor_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS update_tutor_rating() CASCADE;

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
-- MOCK DATA
-- =====================================================

-- Password hash for "Demo1234" using bcrypt
-- Hash: $2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e
-- Note: In production, generate this using bcrypt with proper salt rounds

-- Insert Admin Account
INSERT INTO accounts (id, username, email, password_hash, account_type, is_active, email_verified, full_name, phone_number, bio, location_city, location_state, status, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'admin', 'admin@example.com', '$2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e', 'admin', true, true, 'Admin User', '555-0000', 'System Administrator', 'New York', 'NY', 'online', '2025-11-01 10:00:00', '2025-11-25 09:00:00');

-- Insert Student Accounts
INSERT INTO accounts (id, username, email, password_hash, account_type, is_active, email_verified, full_name, phone_number, bio, location_city, location_state, status, created_at, updated_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'student1', 'student1@example.com', '$2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e', 'student', true, true, 'Emily Johnson', '555-0101', 'High school senior preparing for college entrance exams. Love math and science!', 'Los Angeles', 'CA', 'online', '2025-10-15 08:30:00', '2025-11-25 10:15:00'),
('22222222-2222-2222-2222-222222222222', 'student2', 'student2@example.com', '$2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e', 'student', true, true, 'Michael Chen', '555-0102', 'College freshman majoring in Computer Science. Looking to improve my programming skills.', 'San Francisco', 'CA', 'offline', '2025-10-20 14:20:00', '2025-11-24 18:45:00');

-- Insert Tutor Accounts
INSERT INTO accounts (id, username, email, password_hash, account_type, is_active, email_verified, full_name, phone_number, bio, location_city, location_state, status, created_at, updated_at)
VALUES 
('33333333-3333-3333-3333-333333333333', 'tutor1', 'tutor1@example.com', '$2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e', 'tutor', true, true, 'Dr. Sarah Williams', '555-0201', 'PhD in Mathematics with 10 years of teaching experience. Specialized in calculus and algebra.', 'Boston', 'MA', 'online', '2025-09-01 09:00:00', '2025-11-25 08:30:00'),
('44444444-4444-4444-4444-444444444444', 'tutor2', 'tutor2@example.com', '$2a$12$cNsR2DIdJWcsEeGGs0jBze9E5t0L6j8CrFGhJD6uRNcqEbKbFh50e', 'tutor', true, true, 'James Rodriguez', '555-0202', 'Software Engineer with 5+ years experience. Expert in Python, JavaScript, and web development.', 'Austin', 'TX', 'online', '2025-09-10 11:00:00', '2025-11-25 07:20:00');

-- Insert Student Profiles
INSERT INTO student_profiles (id, account_id, current_school, graduation_year, bio, grade_level, subjects_of_interest, learning_goals, total_sessions, created_at, updated_at)
VALUES 
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Lincoln High School', 2026, 'Aspiring engineer with a passion for STEM subjects.', '12th Grade', ARRAY['Mathematics', 'Physics', 'Chemistry', 'Computer Science'], 'Ace SAT exams and get into top engineering schools', 3, '2025-10-15 08:30:00', '2025-11-25 10:15:00'),
(uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'UC Berkeley', 2028, 'Love coding and building projects. Want to become a full-stack developer.', 'College Freshman', ARRAY['Computer Science', 'Web Development', 'Data Structures'], 'Master advanced programming concepts and build a strong portfolio', 2, '2025-10-20 14:20:00', '2025-11-24 18:45:00');

-- Insert Tutor Profiles (with admin approval)
INSERT INTO tutor_profiles (id, account_id, hourly_rate, subjects_taught, is_verified, bio, rating, total_reviews, total_sessions, response_time_avg, is_online, available_days, approval_status, admin_notes, approved_at, approved_by, created_at, updated_at)
VALUES 
(uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 45.00, ARRAY['Mathematics', 'Calculus', 'Algebra', 'Geometry', 'Statistics'], true, 'Passionate about making math accessible and fun. I use real-world examples and interactive teaching methods.', 4.85, 2, 5, 120, true, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'approved', 'Excellent credentials and teaching experience', '2025-09-05 14:00:00', '00000000-0000-0000-0000-000000000001', '2025-09-01 09:00:00', '2025-11-25 08:30:00'),
(uuid_generate_v4(), '44444444-4444-4444-4444-444444444444', 55.00, ARRAY['Computer Science', 'Python', 'JavaScript', 'Web Development', 'Data Structures', 'Algorithms'], true, 'Professional developer helping students learn modern programming. Focus on practical, hands-on learning.', 4.90, 1, 3, 90, true, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'], 'approved', 'Strong technical background and good communication skills', '2025-09-12 10:00:00', '00000000-0000-0000-0000-000000000001', '2025-09-10 11:00:00', '2025-11-25 07:20:00');

-- Insert Subjects
INSERT INTO subjects (id, name, description, category, created_at)
VALUES 
(uuid_generate_v4(), 'Mathematics', 'General mathematics including arithmetic, algebra, geometry', 'academic', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Calculus', 'Differential and integral calculus', 'academic', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Physics', 'Classical mechanics, electromagnetism, thermodynamics', 'academic', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Chemistry', 'General chemistry, organic chemistry, biochemistry', 'academic', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Computer Science', 'Programming, algorithms, data structures, software engineering', 'academic', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Python', 'Python programming language and its applications', 'programming', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'JavaScript', 'JavaScript programming for web development', 'programming', '2025-09-01 00:00:00'),
(uuid_generate_v4(), 'Web Development', 'HTML, CSS, JavaScript, frontend and backend development', 'programming', '2025-09-01 00:00:00');

-- Insert Tasks for Students
INSERT INTO tasks (id, user_id, title, description, subject, priority, estimated_time, due_date, status, progress, created_at, updated_at)
VALUES 
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Complete Calculus Chapter 5', 'Review limits, derivatives, and applications. Complete practice problems 1-20.', 'Calculus', 'high', '3 hours', '2025-11-27', 'in-progress', 60, '2025-11-20 10:00:00', '2025-11-25 09:00:00'),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'SAT Math Practice Test', 'Take full-length practice test and review incorrect answers', 'Mathematics', 'high', '4 hours', '2025-11-29', 'pending', 0, '2025-11-23 14:00:00', '2025-11-23 14:00:00'),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Physics Lab Report', 'Write up findings from pendulum experiment', 'Physics', 'medium', '2 hours', '2025-11-26', 'started', 30, '2025-11-22 16:00:00', '2025-11-24 20:00:00'),
(uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'Build Todo App', 'Create a full-stack todo application using React and Node.js', 'Web Development', 'high', '8 hours', '2025-12-01', 'in-progress', 45, '2025-11-18 09:00:00', '2025-11-25 11:00:00'),
(uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'Study Binary Trees', 'Learn about binary tree traversal algorithms and implement in Python', 'Computer Science', 'medium', '4 hours', '2025-11-28', 'pending', 0, '2025-11-24 15:00:00', '2025-11-24 15:00:00');

-- Insert Tutor Availability (upcoming and past dates)
INSERT INTO tutor_availability (tutor_id, date, start_time, end_time, duration_minutes, hourly_rate, is_booked, notes, created_at, updated_at)
VALUES 
-- Dr. Sarah Williams availability
('33333333-3333-3333-3333-333333333333', '2025-11-26', '14:00:00', '15:00:00', 60, 45.00, false, 'Available for calculus tutoring', '2025-11-20 10:00:00', '2025-11-20 10:00:00'),
('33333333-3333-3333-3333-333333333333', '2025-11-26', '16:00:00', '17:00:00', 60, 45.00, false, NULL, '2025-11-20 10:00:00', '2025-11-20 10:00:00'),
('33333333-3333-3333-3333-333333333333', '2025-11-27', '10:00:00', '11:00:00', 60, 45.00, false, NULL, '2025-11-20 10:00:00', '2025-11-20 10:00:00'),
('33333333-3333-3333-3333-333333333333', '2025-11-27', '14:00:00', '15:00:00', 60, 45.00, false, NULL, '2025-11-20 10:00:00', '2025-11-20 10:00:00'),
('33333333-3333-3333-3333-333333333333', '2025-11-28', '09:00:00', '10:00:00', 60, 45.00, false, NULL, '2025-11-20 10:00:00', '2025-11-20 10:00:00'),
-- James Rodriguez availability
('44444444-4444-4444-4444-444444444444', '2025-11-26', '18:00:00', '19:00:00', 60, 55.00, false, 'Web development session available', '2025-11-20 11:00:00', '2025-11-20 11:00:00'),
('44444444-4444-4444-4444-444444444444', '2025-11-27', '15:00:00', '16:00:00', 60, 55.00, false, NULL, '2025-11-20 11:00:00', '2025-11-20 11:00:00'),
('44444444-4444-4444-4444-444444444444', '2025-11-27', '19:00:00', '20:00:00', 60, 55.00, false, NULL, '2025-11-20 11:00:00', '2025-11-20 11:00:00'),
('44444444-4444-4444-4444-444444444444', '2025-11-29', '10:00:00', '11:00:00', 60, 55.00, false, NULL, '2025-11-20 11:00:00', '2025-11-20 11:00:00'),
('44444444-4444-4444-4444-444444444444', '2025-11-30', '14:00:00', '15:00:00', 60, 55.00, false, NULL, '2025-11-20 11:00:00', '2025-11-20 11:00:00');

-- Insert Bookings (mix of completed, scheduled, and pending)
INSERT INTO bookings (student_id, tutor_id, booking_date, start_time, end_time, duration_minutes, subject, session_type, meeting_type, location, hourly_rate, total_amount, student_notes, tutor_notes, session_notes, payment_status, status, created_at, updated_at, completed_at, tutor_response_message, responded_at, review_submitted, review_submitted_at)
VALUES 
-- Completed session 1
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '2025-11-18', '14:00:00', '15:00:00', 60, 'Calculus', 'one-on-one', 'online', 'Zoom', 45.00, 45.00, 'Need help with derivatives and chain rule', 'Student was well-prepared and engaged', 'Covered chain rule, product rule, and quotient rule. Assigned practice problems.', 'paid', 'completed', '2025-11-15 09:00:00', '2025-11-18 15:00:00', '2025-11-18 15:00:00', 'Looking forward to our session! I''ll prepare materials on derivatives.', '2025-11-15 10:30:00', true, '2025-11-19 10:00:00'),
-- Completed session 2
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '2025-11-20', '18:00:00', '19:00:00', 60, 'Web Development', 'one-on-one', 'online', 'Google Meet', 55.00, 55.00, 'Want to learn React hooks and state management', 'Great progress! Student grasps concepts quickly', 'Introduced useState and useEffect. Built a simple counter app together.', 'paid', 'completed', '2025-11-17 14:00:00', '2025-11-20 19:00:00', '2025-11-20 19:00:00', 'Perfect! We''ll dive into React hooks. Very practical session ahead.', '2025-11-17 15:00:00', true, '2025-11-21 09:00:00'),
-- Completed session 3 (no review yet)
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '2025-11-22', '10:00:00', '11:00:00', 60, 'Mathematics', 'one-on-one', 'online', 'Zoom', 45.00, 45.00, 'SAT prep - need help with algebra word problems', NULL, 'Worked through 15 SAT-style algebra problems. Student improved significantly.', 'paid', 'completed', '2025-11-19 16:00:00', '2025-11-22 11:00:00', '2025-11-22 11:00:00', 'I have lots of SAT practice materials. This will be very productive!', '2025-11-19 17:00:00', false, NULL),
-- Scheduled upcoming session
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '2025-11-27', '15:00:00', '16:00:00', 60, 'Python', 'one-on-one', 'online', 'Zoom', 55.00, 55.00, 'Need help debugging my data structures assignment', NULL, NULL, 'pending', 'scheduled', '2025-11-24 11:00:00', '2025-11-24 12:00:00', NULL, 'Sure! Send me your code beforehand so I can review it.', '2025-11-24 11:30:00', false, NULL),
-- Scheduled upcoming session 2
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '2025-11-28', '09:00:00', '10:00:00', 60, 'Calculus', 'one-on-one', 'online', 'Zoom', 45.00, 45.00, 'Continue with integration techniques', NULL, NULL, 'pending', 'scheduled', '2025-11-25 08:00:00', '2025-11-25 09:00:00', NULL, 'Great! We''ll cover integration by parts and substitution.', '2025-11-25 08:30:00', false, NULL),
-- Pending booking request
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '2025-11-29', '14:00:00', '15:00:00', 60, 'Statistics', 'one-on-one', 'online', 'Zoom', 45.00, 45.00, 'Introduction to probability and statistics', NULL, NULL, 'pending', 'pending', '2025-11-25 10:00:00', '2025-11-25 10:00:00', NULL, NULL, NULL, false, NULL);

-- Update tutor_availability to mark booked slots
UPDATE tutor_availability SET is_booked = true, booking_id = 4 
WHERE tutor_id = '44444444-4444-4444-4444-444444444444' AND date = '2025-11-27' AND start_time = '15:00:00';

UPDATE tutor_availability SET is_booked = true, booking_id = 5 
WHERE tutor_id = '33333333-3333-3333-3333-333333333333' AND date = '2025-11-28' AND start_time = '09:00:00';

-- Insert Reviews for completed sessions
INSERT INTO reviews (booking_id, student_id, tutor_id, rating, review_text, would_recommend, session_quality_rating, communication_rating, punctuality_rating, helpfulness_rating, created_at, updated_at)
VALUES 
(1, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 5, 'Dr. Williams is an amazing tutor! She explained derivatives in a way that finally made sense to me. Very patient and encouraging.', true, 5, 5, 5, 5, '2025-11-19 10:00:00', '2025-11-19 10:00:00'),
(2, '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 5, 'James is fantastic! He really knows his stuff and makes programming fun. The hands-on approach helped me understand React hooks much better.', true, 5, 5, 5, 5, '2025-11-21 09:00:00', '2025-11-21 09:00:00');

-- Note: The triggers will automatically update tutor ratings based on these reviews

-- Insert Messages (conversation between students and tutors)
INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at, updated_at)
VALUES 
-- Conversation between Emily (student1) and Dr. Williams (tutor1)
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Hi Dr. Williams! I really enjoyed our last session. Could we schedule another one for this week?', true, '2025-11-23 14:30:00', '2025-11-23 14:30:00'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Hi Emily! I''m so glad you found it helpful. I have availability on Thursday at 9 AM. Does that work for you?', true, '2025-11-23 15:00:00', '2025-11-23 15:00:00'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Perfect! Thursday at 9 AM works great. See you then!', true, '2025-11-23 15:15:00', '2025-11-23 15:15:00'),
-- Conversation between Michael (student2) and James (tutor2)
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Hey James! I''m stuck on a binary tree problem for my CS class. Are you available this week?', true, '2025-11-24 10:00:00', '2025-11-24 10:00:00'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Hi Michael! I can help with that. I have a slot on Wednesday at 3 PM. Want to book it?', true, '2025-11-24 10:30:00', '2025-11-24 10:30:00'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Sounds good! I''ll send you my code before the session.', false, '2025-11-24 11:00:00', '2025-11-24 11:00:00');

-- Insert AI Chat Messages (conversations with AI assistant)
INSERT INTO ai_chat_messages (user_id, role, message, created_at, updated_at)
VALUES 
-- Emily's conversation with AI
('11111111-1111-1111-1111-111111111111', 'user', 'Can you help me understand the concept of limits in calculus?', '2025-11-24 16:00:00', '2025-11-24 16:00:00'),
('11111111-1111-1111-1111-111111111111', 'assistant', 'Of course! A limit in calculus describes the value that a function approaches as the input approaches a certain point. Think of it like this: imagine you''re walking toward a door. The limit would be your position at the door, even if you never quite reach it. For example, as x approaches 2 in the function f(x) = x + 1, the limit is 3.', '2025-11-24 16:00:05', '2025-11-24 16:00:05'),
('11111111-1111-1111-1111-111111111111', 'user', 'That makes sense! Can you give me a practice problem?', '2025-11-24 16:02:00', '2025-11-24 16:02:00'),
('11111111-1111-1111-1111-111111111111', 'assistant', 'Sure! Try finding the limit as x approaches 3 for the function f(x) = (x² - 9)/(x - 3). Hint: Factor the numerator first!', '2025-11-24 16:02:05', '2025-11-24 16:02:05'),
-- Michael's conversation with AI
('22222222-2222-2222-2222-222222222222', 'user', 'What''s the difference between useState and useEffect in React?', '2025-11-25 09:00:00', '2025-11-25 09:00:00'),
('22222222-2222-2222-2222-222222222222', 'assistant', 'Great question! useState and useEffect serve different purposes:\n\n1. **useState**: Manages state in your component. It returns the current state value and a function to update it. Use it when you need to store and update data that affects your UI.\n\n2. **useEffect**: Handles side effects in your component, like fetching data, subscriptions, or manually changing the DOM. It runs after the component renders.\n\nThink of useState as "remembering" values, and useEffect as "doing" things in response to changes.', '2025-11-25 09:00:05', '2025-11-25 09:00:05');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Display record counts for all tables
SELECT 'Accounts' as table_name, COUNT(*) as record_count FROM accounts
UNION ALL
SELECT 'Student Profiles', COUNT(*) FROM student_profiles
UNION ALL
SELECT 'Tutor Profiles', COUNT(*) FROM tutor_profiles
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Tutor Availability', COUNT(*) FROM tutor_availability
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'AI Chat Messages', COUNT(*) FROM ai_chat_messages;

-- =====================================================
-- COMPLETED
-- =====================================================
-- Schema and mock data insertion complete!
-- 
-- Login Credentials:
-- Admin: admin@example.com / Demo1234
-- Student 1: student1@example.com / Demo1234
-- Student 2: student2@example.com / Demo1234
-- Tutor 1: tutor1@example.com / Demo1234
-- Tutor 2: tutor2@example.com / Demo1234
