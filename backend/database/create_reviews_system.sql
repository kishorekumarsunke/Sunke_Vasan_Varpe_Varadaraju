-- Create reviews system for completed sessions
-- This allows students to rate and review tutors after sessions

BEGIN;

-- Create reviews table for session reviews
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    student_id UUID NOT NULL,
    tutor_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT true,
    session_quality_rating INTEGER CHECK (session_quality_rating >= 1 AND session_quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Ensure only one review per booking
    UNIQUE(booking_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id ON reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Add review tracking to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS review_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMP;

-- Create trigger to update tutor_profiles rating when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT, UPDATE, DELETE on reviews
DROP TRIGGER IF EXISTS trigger_update_tutor_rating_insert ON reviews;
DROP TRIGGER IF EXISTS trigger_update_tutor_rating_update ON reviews;
DROP TRIGGER IF EXISTS trigger_update_tutor_rating_delete ON reviews;

CREATE TRIGGER trigger_update_tutor_rating_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

CREATE TRIGGER trigger_update_tutor_rating_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

CREATE TRIGGER trigger_update_tutor_rating_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_rating();

COMMIT;