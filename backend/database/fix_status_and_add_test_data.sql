-- Update status constraint to allow new values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'rejected'));

-- Add test pending bookings
INSERT INTO bookings (
    student_id, tutor_id, booking_date, start_time, end_time, 
    duration_minutes, subject, session_type, meeting_type,
    hourly_rate, total_amount, student_notes, status, payment_status
) VALUES 
('cb38b155-c51a-4246-9bcc-1eaa4445c0e1', '791cb15c-e748-450a-a77a-5b392116204f', 
 '2025-12-15', '14:00:00', '15:30:00', 90, 'Mathematics', 'tutoring', 'virtual', 
 55.00, 82.50, 'Need help with calculus', 'pending', 'pending'),
('cb38b155-c51a-4246-9bcc-1eaa4445c0e1', '791cb15c-e748-450a-a77a-5b392116204f', 
 '2025-12-20', '10:00:00', '11:00:00', 60, 'Physics', 'homework', 'virtual', 
 55.00, 55.00, 'Physics homework help needed', 'pending', 'pending');

SELECT 'Migration and test data completed successfully!' as message;