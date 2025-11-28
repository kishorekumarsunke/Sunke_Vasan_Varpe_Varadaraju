-- Mark some bookings as completed for testing the review system
UPDATE bookings 
SET status = 'completed', 
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (9, 11);

-- Ensure the review_submitted field is false for these completed sessions
UPDATE bookings 
SET review_submitted = false
WHERE id IN (9, 11) AND status = 'completed';