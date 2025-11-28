-- Fix booking system database structure
-- This migration will:
-- 1. Create tutor_availability table
-- 2. Fix booking_requests table structure  
-- 3. Migrate existing data
-- 4. Add proper constraints

-- First, create tutor_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS tutor_availability (
    id SERIAL PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    hourly_rate DECIMAL(10,2) NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booking_id INTEGER NULL, -- Will reference bookings table
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure no overlapping availability slots for same tutor
    UNIQUE(tutor_id, date, start_time)
);

-- Add proper structure to booking_requests
-- First, backup existing data
CREATE TABLE booking_requests_backup AS SELECT * FROM booking_requests;

-- Drop and recreate booking_requests with proper structure
DROP TABLE booking_requests CASCADE;

CREATE TABLE booking_requests (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    availability_id INTEGER NULL REFERENCES tutor_availability(id) ON DELETE SET NULL,
    
    -- Booking details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Session information
    subject VARCHAR(100) NOT NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'homework', -- homework, test_prep, concept_review, etc.
    meeting_type VARCHAR(20) NOT NULL DEFAULT 'virtual', -- virtual, in_person
    location TEXT, -- for in_person meetings or virtual meeting link
    
    -- Pricing
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Request details
    student_notes TEXT, -- Student's notes/requirements
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    
    -- Response details
    tutor_response_message TEXT,
    responded_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table for accepted requests
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_request_id INTEGER NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Session details (copied from request when accepted)
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    subject VARCHAR(100) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    meeting_type VARCHAR(20) NOT NULL,
    location TEXT,
    
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Session status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    
    -- Session notes
    student_notes TEXT,
    tutor_notes TEXT,
    session_notes TEXT, -- Notes during/after session
    
    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_date ON tutor_availability(date);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_is_booked ON tutor_availability(is_booked);

CREATE INDEX IF NOT EXISTS idx_booking_requests_student_id ON booking_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_tutor_id ON booking_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_date ON booking_requests(booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_tutor_availability_updated_at BEFORE UPDATE ON tutor_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to link availability bookings
ALTER TABLE tutor_availability 
    ADD CONSTRAINT fk_tutor_availability_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

COMMIT;