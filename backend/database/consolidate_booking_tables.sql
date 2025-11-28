-- Consolidate booking_requests and bookings into single bookings table
-- This migration removes the need for two separate tables

BEGIN;

-- First, add missing columns to bookings table that exist in booking_requests
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS availability_id UUID,
    ADD COLUMN IF NOT EXISTS tutor_response_message TEXT,
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;

-- Update the status column to include all possible values
-- Current bookings table has: scheduled, completed, cancelled
-- We need to add: pending, accepted, rejected

-- No need to modify the status column as it already accepts text values

-- Migrate any existing data from booking_requests that isn't already in bookings
-- (In our current case, all booking_requests have corresponding bookings, but this handles edge cases)

-- Insert any booking_requests that don't have corresponding bookings
INSERT INTO bookings (
    student_id, tutor_id, availability_id, booking_date, start_time, end_time,
    duration_minutes, subject, session_type, meeting_type, location,
    hourly_rate, total_amount, student_notes, tutor_response_message,
    status, created_at, updated_at, responded_at
)
SELECT 
    br.student_id, 
    br.tutor_id, 
    br.availability_id,
    br.booking_date, 
    br.start_time, 
    br.end_time,
    br.duration_minutes, 
    br.subject, 
    br.session_type, 
    br.meeting_type, 
    br.location,
    br.hourly_rate, 
    br.total_amount, 
    br.student_notes,
    br.tutor_response_message,
    -- Map booking_requests status to bookings status
    CASE 
        WHEN br.status = 'pending' THEN 'pending'
        WHEN br.status = 'accepted' THEN 'scheduled'
        WHEN br.status = 'declined' THEN 'rejected'
        ELSE br.status
    END as status,
    br.created_at, 
    br.updated_at,
    br.responded_at
FROM booking_requests br
LEFT JOIN bookings b ON b.booking_request_id = br.id
WHERE b.id IS NULL;

-- Update existing bookings to include response information from booking_requests
UPDATE bookings 
SET 
    availability_id = CASE WHEN br.availability_id IS NOT NULL THEN br.availability_id::UUID ELSE NULL END,
    tutor_response_message = br.tutor_response_message,
    responded_at = br.responded_at
FROM booking_requests br 
WHERE bookings.booking_request_id = br.id;

-- Remove the booking_request_id column as it's no longer needed
ALTER TABLE bookings DROP COLUMN booking_request_id;

-- Drop the booking_requests table
DROP TABLE booking_requests;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_status ON bookings(tutor_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_student_status ON bookings(student_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(booking_date, status);

COMMIT;

-- Display the final structure
SELECT 'Migration completed successfully! Final bookings table structure:' as message;