import { pool } from '../../config/database.js';

// Helper function to convert day name to number (0 = Monday)
const dayNameToNumber = (dayName) => {
    const days = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
        'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };
    return days[dayName] !== undefined ? days[dayName] : 0;
};

// Helper function to convert day number to name
const dayNumberToName = (dayNumber) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNumber] || 'Monday';
};

// Get tutor availability
export const getTutorAvailability = async (req, res) => {
    try {
        // Temporary: Use mock tutor ID for testing
        const tutorId = req.params.tutorId || req.user?.id || '123e4567-e89b-12d3-a456-426614174000';
        
        console.log('Getting availability for tutor:', tutorId);

        console.log(`Getting availability for tutor: ${tutorId}`);

        const query = `
            SELECT id, day_of_week, start_time, end_time, is_available, created_at, updated_at
            FROM tutor_availability 
            WHERE tutor_id = $1 AND is_available = true
            ORDER BY day_of_week, start_time
        `;

        const result = await pool.query(query, [tutorId]);
        
        // Group by day for easier frontend consumption
        const groupedAvailability = {};
        const calendarSlots = [];

        result.rows.forEach(row => {
            const dayName = dayNumberToName(row.day_of_week);
            
            if (!groupedAvailability[dayName]) {
                groupedAvailability[dayName] = [];
            }
            
            const slot = {
                id: row.id,
                startTime: row.start_time,
                endTime: row.end_time,
                isAvailable: row.is_available
            };
            
            groupedAvailability[dayName].push(slot);
            
            // Also add to calendar format
            calendarSlots.push({
                id: row.id,
                day: dayName,
                startTime: row.start_time,
                endTime: row.end_time,
                isAvailable: row.is_available,
                createdAt: row.created_at
            });
        });

        console.log(`Found ${result.rows.length} availability slots for tutor ${tutorId}`);
        console.log('Grouped availability:', JSON.stringify(groupedAvailability, null, 2));
        
        res.json({
            success: true,
            availability: groupedAvailability,
            calendarSlots: calendarSlots,
            totalSlots: result.rows.length
        });

    } catch (error) {
        console.error('Error getting tutor availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tutor availability',
            error: error.message
        });
    }
};

// Add availability slot
export const addAvailabilitySlot = async (req, res) => {
    try {
        // Temporary: Use mock tutor ID for testing
        const tutorId = req.user?.id || '123e4567-e89b-12d3-a456-426614174000'; // Mock UUID
        const { day, dayOfWeek, startTime, endTime, isRecurring, specificDate } = req.body;

        console.log('Add slot request received:', {
            tutorId,
            day,
            dayOfWeek,
            startTime,
            endTime,
            isRecurring,
            specificDate
        });

        // Use day or dayOfWeek (support both formats)
        const dayName = day || dayOfWeek;
        if (!dayName || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Day, start time, and end time are required'
            });
        }

        // Validate time format and logic
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        const dayNumber = dayNameToNumber(dayName);
        
        console.log(`Adding availability slot for tutor ${tutorId}: ${dayName} (${dayNumber}) ${startTime}-${endTime}`);
        console.log('Request body:', req.body);
        console.log('Converted day number:', dayNumber);
        
        if (dayNumber === undefined || dayNumber < 0 || dayNumber > 6) {
            return res.status(400).json({
                success: false,
                message: `Invalid day: ${dayName}. Must be a valid day of the week.`
            });
        }

        // Check for overlapping slots
        const overlapQuery = `
            SELECT id FROM tutor_availability 
            WHERE tutor_id = $1 
            AND day_of_week = $2 
            AND is_available = true
            AND (
                (start_time < $4 AND end_time > $3) OR
                (start_time < $3 AND end_time > $3) OR
                (start_time < $4 AND end_time > $4)
            )
        `;

        const overlapResult = await pool.query(overlapQuery, [tutorId, dayNumber, startTime, endTime]);

        if (overlapResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot overlaps with existing availability'
            });
        }

        // Insert new availability slot
        const insertQuery = `
            INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, day_of_week, start_time, end_time, is_available, created_at
        `;

        const insertResult = await pool.query(insertQuery, [
            tutorId, 
            dayNumber, 
            startTime, 
            endTime, 
            true
        ]);

        const newSlot = insertResult.rows[0];

        res.json({
            success: true,
            message: 'Availability slot added successfully',
            slot: {
                id: newSlot.id,
                day: dayName,
                dayOfWeek: dayNumber,
                startTime: newSlot.start_time,
                endTime: newSlot.end_time,
                isAvailable: newSlot.is_available,
                createdAt: newSlot.created_at
            }
        });

    } catch (error) {
        console.error('Error adding availability slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add availability slot',
            error: error.message
        });
    }
};

// Update availability slot
export const updateAvailabilitySlot = async (req, res) => {
    try {
        const tutorId = req.user?.id;
        const { slotId } = req.params;
        const { startTime, endTime, isAvailable } = req.body;

        if (!tutorId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`Updating availability slot ${slotId} for tutor ${tutorId}`);

        // Check if the slot belongs to the tutor
        const checkQuery = `
            SELECT id FROM tutor_availability 
            WHERE id = $1 AND tutor_id = $2
        `;

        const checkResult = await pool.query(checkQuery, [slotId, tutorId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        // Build dynamic update query
        let updateFields = [];
        let updateValues = [];
        let paramCounter = 1;

        if (startTime !== undefined) {
            updateFields.push(`start_time = $${paramCounter++}`);
            updateValues.push(startTime);
        }

        if (endTime !== undefined) {
            updateFields.push(`end_time = $${paramCounter++}`);
            updateValues.push(endTime);
        }

        if (isAvailable !== undefined) {
            updateFields.push(`is_available = $${paramCounter++}`);
            updateValues.push(isAvailable);
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(slotId, tutorId);

        const updateQuery = `
            UPDATE tutor_availability 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCounter++} AND tutor_id = $${paramCounter++}
            RETURNING id, day_of_week, start_time, end_time, is_available, updated_at
        `;

        const updateResult = await pool.query(updateQuery, updateValues);
        const updatedSlot = updateResult.rows[0];

        res.json({
            success: true,
            message: 'Availability slot updated successfully',
            slot: {
                id: updatedSlot.id,
                day: dayNumberToName(updatedSlot.day_of_week),
                dayOfWeek: updatedSlot.day_of_week,
                startTime: updatedSlot.start_time,
                endTime: updatedSlot.end_time,
                isAvailable: updatedSlot.is_available,
                updatedAt: updatedSlot.updated_at
            }
        });

    } catch (error) {
        console.error('Error updating availability slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update availability slot',
            error: error.message
        });
    }
};

// Delete availability slot
export const deleteAvailabilitySlot = async (req, res) => {
    try {
        const tutorId = req.user?.id;
        const { slotId } = req.params;

        if (!tutorId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`Deleting availability slot ${slotId} for tutor ${tutorId}`);

        const deleteQuery = `
            DELETE FROM tutor_availability 
            WHERE id = $1 AND tutor_id = $2
            RETURNING id
        `;

        const deleteResult = await pool.query(deleteQuery, [slotId, tutorId]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Availability slot not found'
            });
        }

        res.json({
            success: true,
            message: 'Availability slot deleted successfully',
            deletedSlotId: slotId
        });

    } catch (error) {
        console.error('Error deleting availability slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete availability slot',
            error: error.message
        });
    }
};

// Bulk update availability (for setting entire schedule)
export const setTutorAvailability = async (req, res) => {
    try {
        const tutorId = req.user?.id;
        const { availability } = req.body;

        if (!tutorId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!Array.isArray(availability)) {
            return res.status(400).json({
                success: false,
                message: 'Availability must be an array of slots'
            });
        }

        console.log(`Setting bulk availability for tutor ${tutorId}: ${availability.length} slots`);

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Clear existing availability
            await client.query(
                'DELETE FROM tutor_availability WHERE tutor_id = $1',
                [tutorId]
            );

            // Insert new availability slots
            for (const slot of availability) {
                if (!slot.dayOfWeek || !slot.startTime || !slot.endTime) {
                    continue; // Skip invalid slots
                }

                const dayNumber = dayNameToNumber(slot.dayOfWeek);

                await client.query(`
                    INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    tutorId,
                    dayNumber,
                    slot.startTime,
                    slot.endTime,
                    slot.isAvailable !== false // Default to true
                ]);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Successfully set ${availability.length} availability slots`,
                slotsCount: availability.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error setting tutor availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set tutor availability',
            error: error.message
        });
    }
};