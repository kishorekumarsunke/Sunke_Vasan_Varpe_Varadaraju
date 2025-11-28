import DatabaseUtils from '../utils/database.js';
import { validationResult } from 'express-validator';

class TutorProfileController {
    /**
     * Get tutor profile
     */
    static async getProfile(req, res) {
        try {
            console.log('🔍 Tutor profile request - Token payload:', req.user);
            const userId = req.user?.userId || req.user?.id;
            console.log('🆔 Extracted userId:', userId);

            if (!userId) {
                console.warn('Tutor profile request missing userId in token', { tokenPayload: req.user });
                return res.status(401).json({
                    success: false,
                    message: 'Authentication token invalid. Please sign in again.'
                });
            }

            console.log('🔎 Querying accounts table for userId:', userId);
            const accountResult = await DatabaseUtils.query(
                `SELECT id, email, username, full_name, phone_number, location_city, location_state, profile_image, bio 
                 FROM accounts 
                 WHERE id = $1`,
                [userId]
            );

            console.log('📊 Account query result:', accountResult.rows.length, 'rows found');
            if (accountResult.rows.length === 0) {
                console.warn('Tutor profile requested for non-existent account', {
                    userId,
                    tokenPayload: req.user
                });
                return res.status(404).json({
                    success: false,
                    message: 'Account not found. Please sign in again.'
                });
            }

            const result = await DatabaseUtils.query(`
                SELECT 
                    tp.*,
                    a.email,
                    a.username,
                    a.full_name,
                    a.phone_number,
                    a.location_city,
                    a.location_state,
                    a.profile_image,
                    a.bio as account_bio
                FROM tutor_profiles tp
                LEFT JOIN accounts a ON tp.account_id = a.id
                WHERE tp.account_id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                // Create empty profile if doesn't exist
                await DatabaseUtils.query(`
                    INSERT INTO tutor_profiles (account_id) VALUES ($1)
                `, [userId]);

                return res.json({
                    success: true,
                    data: {
                        ...accountResult.rows[0],
                        account_id: userId,
                        hourly_rate: null,
                        subjects_taught: null,
                        available_days: [],
                        response_time_avg: null,
                        is_online: false,
                        is_verified: false,
                        bio: null,
                        // Read-only analytics
                        rating: null,
                        total_reviews: 0,
                        total_sessions: 0
                    }
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error fetching tutor profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching tutor profile',
                error: error.message
            });
        }
    }

    /**
     * Update tutor profile
     */
    static async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const userId = req.user.userId;
            const {
                // Accounts table fields
                full_name,
                phone_number,
                bio,
                location_city,
                location_state,
                profile_image,
                // Tutor specific (editable fields only)
                hourly_rate,
                subjects_taught,
                available_days,
                response_time_avg,
                is_online
            } = req.body;

            console.log('Update request data:', { full_name, phone_number, bio, location_city, location_state, profile_image });

            // Check if profile exists
            const existingProfile = await DatabaseUtils.query(`
                SELECT id FROM tutor_profiles WHERE account_id = $1
            `, [userId]);

            // Use transaction to update both accounts and tutor_profiles
            const result = await DatabaseUtils.transaction(async (client) => {
                // Update accounts table
                if (full_name || phone_number || bio !== undefined || location_city || location_state || profile_image) {
                    await client.query(`
                        UPDATE accounts SET 
                            full_name = COALESCE(NULLIF($2, ''), full_name),
                            phone_number = COALESCE(NULLIF($3, ''), phone_number),
                            bio = $4::text,
                            location_city = COALESCE(NULLIF($5, ''), location_city),
                            location_state = COALESCE(NULLIF($6, ''), location_state),
                            profile_image = COALESCE(NULLIF($7, ''), profile_image),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [userId, full_name, phone_number, bio, location_city, location_state, profile_image]);
                }

                // Check if tutor profile exists
                const existingProfile = await client.query(`
                    SELECT id FROM tutor_profiles WHERE account_id = $1
                `, [userId]);

                let profileResult;
                if (existingProfile.rows.length === 0) {
                    // Create new tutor profile
                    profileResult = await client.query(`
                        INSERT INTO tutor_profiles (
                            account_id, hourly_rate, subjects_taught,
                            available_days, response_time_avg, is_online
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *
                    `, [userId, hourly_rate, subjects_taught, available_days, response_time_avg, is_online]);
                } else {
                    // Update existing tutor profile
                    profileResult = await client.query(`
                        UPDATE tutor_profiles SET
                            hourly_rate = COALESCE($2, hourly_rate),
                            subjects_taught = COALESCE($3, subjects_taught),
                            available_days = COALESCE($4, available_days),
                            response_time_avg = COALESCE($5, response_time_avg),
                            is_online = COALESCE($6, is_online),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE account_id = $1
                        RETURNING *
                    `, [userId, hourly_rate, subjects_taught, available_days, response_time_avg, is_online]);
                }

                return profileResult;
            });

            res.json({
                success: true,
                message: 'Tutor profile updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating tutor profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating tutor profile',
                error: error.message
            });
        }
    }

    /**
     * Check profile completion status
     */
    static async getProfileStatus(req, res) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const result = await DatabaseUtils.query(`
                SELECT 
                    tp.*,
                    a.full_name,
                    a.bio as account_bio
                FROM tutor_profiles tp
                LEFT JOIN accounts a ON tp.account_id = a.id
                WHERE tp.account_id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        isComplete: false,
                        missingFields: ['profile', 'hourly_rate', 'subjects', 'availability'],
                        completionPercentage: 0
                    }
                });
            }

            const profile = result.rows[0];
            const missingFields = [];

            // Check required fields
            if (!profile.full_name || profile.full_name.trim() === '') {
                missingFields.push('full_name');
            }
            if (!profile.hourly_rate || profile.hourly_rate <= 0) {
                missingFields.push('hourly_rate');
            }
            if (!profile.subjects_taught || !Array.isArray(profile.subjects_taught) || profile.subjects_taught.length === 0) {
                missingFields.push('subjects');
            }
            if (!profile.available_days || !Array.isArray(profile.available_days) || profile.available_days.length === 0) {
                missingFields.push('availability');
            }

            const totalFields = 4;
            const completedFields = totalFields - missingFields.length;
            const completionPercentage = Math.round((completedFields / totalFields) * 100);
            const isComplete = missingFields.length === 0;

            res.json({
                success: true,
                data: {
                    isComplete,
                    missingFields,
                    completionPercentage,
                    profile: profile
                }
            });

        } catch (error) {
            console.error('Error checking profile completion:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking profile completion',
                error: error.message
            });
        }
    }
}


export default TutorProfileController;