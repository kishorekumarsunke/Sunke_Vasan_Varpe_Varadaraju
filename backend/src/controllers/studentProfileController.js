import DatabaseUtils from '../utils/database.js';
import { validationResult } from 'express-validator';

class StudentProfileController {
    /**
     * Get student profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;

            if (!userId) {
                console.warn('Student profile request missing userId in token', { tokenPayload: req.user });
                return res.status(401).json({
                    success: false,
                    message: 'Authentication token invalid. Please sign in again.'
                });
            }

            const accountResult = await DatabaseUtils.query(`
                SELECT id, email, username, full_name, phone_number, location_city, location_state, profile_image, bio
                FROM accounts WHERE id = $1
            `, [userId]);

            if (accountResult.rows.length === 0) {
                console.warn('Student profile requested for non-existent account', {
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
                    sp.*,
                    a.email,
                    a.username,
                    a.full_name,
                    a.phone_number,
                    a.location_city,
                    a.location_state,
                    a.profile_image,
                    a.bio as account_bio
                FROM student_profiles sp
                LEFT JOIN accounts a ON sp.account_id = a.id
                WHERE sp.account_id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                // Create empty profile if doesn't exist
                await DatabaseUtils.query(`
                    INSERT INTO student_profiles (account_id) VALUES ($1)
                `, [userId]);

                return res.json({
                    success: true,
                    data: {
                        ...accountResult.rows[0],
                        account_id: userId,
                        current_school: null,
                        graduation_year: null,
                        bio: null
                    }
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error fetching student profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching student profile',
                error: error.message
            });
        }
    }

    /**
     * Update student profile
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
                location_city,
                location_state,
                profile_image,
                // Student specific profile fields
                current_school,
                graduation_year,
                grade_level,
                subjects_of_interest,
                learning_goals,
                bio
            } = req.body;

            const normalizedAccountFields = {
                full_name: full_name ?? null,
                phone_number: phone_number ?? null,
                location_city: location_city ?? null,
                location_state: location_state ?? null,
                profile_image: profile_image ?? null
            };

            const normalizedProfileFields = {
                current_school: current_school ?? null,
                graduation_year: graduation_year ?? null,
                grade_level: grade_level ?? null,
                subjects_of_interest: subjects_of_interest ?? null,
                learning_goals: learning_goals ?? null,
                bio: bio ?? null
            };

            // Check if profile exists
            const existingProfile = await DatabaseUtils.query(`
                SELECT id FROM student_profiles WHERE account_id = $1
            `, [userId]);

            // Use transaction to update both accounts and student_profiles
            const result = await DatabaseUtils.transaction(async (client) => {
                // Update accounts table
                if (
                    full_name !== undefined ||
                    phone_number !== undefined ||
                    location_city !== undefined ||
                    location_state !== undefined ||
                    profile_image !== undefined
                ) {
                    await client.query(`
                        UPDATE accounts SET 
                            full_name = COALESCE(NULLIF($2, ''), full_name),
                            phone_number = COALESCE(NULLIF($3, ''), phone_number),
                            location_city = COALESCE(NULLIF($4, ''), location_city),
                            location_state = COALESCE(NULLIF($5, ''), location_state),
                            profile_image = COALESCE(NULLIF($6, ''), profile_image),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [
                        userId,
                        normalizedAccountFields.full_name,
                        normalizedAccountFields.phone_number,
                        normalizedAccountFields.location_city,
                        normalizedAccountFields.location_state,
                        normalizedAccountFields.profile_image
                    ]);
                }

                // Check if student profile exists
                const existingProfile = await client.query(`
                    SELECT id FROM student_profiles WHERE account_id = $1
                `, [userId]);

                let profileResult;
                if (existingProfile.rows.length === 0) {
                    // Create new student profile
                    profileResult = await client.query(`
                        INSERT INTO student_profiles (
                            account_id, current_school, graduation_year, grade_level, subjects_of_interest, learning_goals, bio
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                    `, [
                        userId,
                        normalizedProfileFields.current_school,
                        normalizedProfileFields.graduation_year,
                        normalizedProfileFields.grade_level,
                        normalizedProfileFields.subjects_of_interest,
                        normalizedProfileFields.learning_goals,
                        normalizedProfileFields.bio
                    ]);
                } else {
                    // Update existing student profile
                    profileResult = await client.query(`
                        UPDATE student_profiles SET
                            current_school = COALESCE($2, current_school),
                            graduation_year = COALESCE($3, graduation_year),
                            grade_level = COALESCE($4, grade_level),
                            subjects_of_interest = COALESCE($5, subjects_of_interest),
                            learning_goals = COALESCE($6, learning_goals),
                            bio = COALESCE($7, bio),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE account_id = $1
                        RETURNING *
                    `, [
                        userId,
                        normalizedProfileFields.current_school,
                        normalizedProfileFields.graduation_year,
                        normalizedProfileFields.grade_level,
                        normalizedProfileFields.subjects_of_interest,
                        normalizedProfileFields.learning_goals,
                        normalizedProfileFields.bio
                    ]);
                }

                return profileResult;
            });

            res.json({
                success: true,
                message: 'Student profile updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating student profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating student profile',
                error: error.message
            });
        }
    }
}

export default StudentProfileController;