import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import DatabaseUtils from '../utils/database.js';

/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */
class AuthController {

    /**
     * Register a new user
     */
    static async register(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { firstName, lastName, email, password, userType } = req.body;

            // Check if user already exists
            const existingUser = await DatabaseUtils.query(
                'SELECT id FROM accounts WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Create account and user profile in a transaction
            const result = await DatabaseUtils.transaction(async (client) => {
                // Create account
                const accountResult = await client.query(`
                    INSERT INTO accounts (username, email, password_hash, account_type, is_active, email_verified)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, username, email, account_type, is_active, created_at
                `, [
                    email.toLowerCase(), // Use email as username for now
                    email.toLowerCase(),
                    passwordHash,
                    userType || 'student',
                    true,
                    false // Email verification can be implemented later
                ]);

                const account = accountResult.rows[0];

                // Update account with profile information
                const profileResult = await client.query(`
                    UPDATE accounts 
                    SET full_name = $2
                    WHERE id = $1
                    RETURNING *
                `, [
                    account.id,
                    `${firstName} ${lastName}`
                ]);

                return {
                    account,
                    profile: profileResult.rows[0]
                };
            });

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: result.account.id,
                    email: result.account.email,
                    role: result.account.account_type
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Return user data (excluding password hash)
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: result.account.id,
                        username: result.account.username,
                        email: result.account.email,
                        role: result.account.account_type,
                        isActive: result.account.is_active,
                        name: result.profile.full_name, // Add name for navbar compatibility
                        full_name: result.profile.full_name,
                        profile: {
                            fullName: result.profile.full_name,
                            displayName: result.profile.display_name
                        }
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }

    /**
     * Login user
     */
    static async login(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Find user by email
            const userResult = await DatabaseUtils.query(`
                SELECT 
                    a.id, a.username, a.email, a.password_hash, a.account_type, 
                    a.is_active, a.email_verified, a.full_name
                FROM accounts a
                WHERE a.email = $1
            `, [email.toLowerCase()]);

            if (userResult.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const user = userResult.rows[0];

            // Check if account is active
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Note: last_login_at column doesn't exist yet, skipping update

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.account_type
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Return user data (excluding password hash)
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.account_type,
                        isActive: user.is_active,
                        emailVerified: user.email_verified,
                        name: user.full_name, // Add name for navbar compatibility
                        full_name: user.full_name
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;

            const userResult = await DatabaseUtils.query(`
                SELECT 
                    id, username, email, account_type, 
                    is_active, email_verified, created_at, updated_at,
                    full_name, profile_image, 
                    phone_number, bio,
                    location_city, location_country
                FROM accounts
                WHERE id = $1
            `, [userId]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = userResult.rows[0];

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.account_type,
                        isActive: user.is_active,
                        emailVerified: user.email_verified,
                        createdAt: user.created_at,
                        profile: {
                            fullName: user.full_name,
                            displayName: user.display_name,
                            profileImage: user.profile_image,
                            phoneNumber: user.phone_number,
                            dateOfBirth: user.date_of_birth,
                            bio: user.bio,
                            location: {
                                city: user.location_city,
                                country: user.location_country
                            },
                            timezone: user.timezone
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Logout user
     */
    static async logout(req, res) {
        try {
            // In a more advanced implementation, you could blacklist the token
            // For now, we'll just return success since JWT tokens are stateless
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Request password reset
     */
    static async forgotPassword(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            // Find user by email
            const userResult = await DatabaseUtils.query(
                'SELECT id, email FROM accounts WHERE email = $1 AND is_active = true',
                [email.toLowerCase()]
            );

            // Always return success to prevent email enumeration
            if (userResult.rows.length === 0) {
                return res.json({
                    success: true,
                    message: 'If an account with that email exists, a password reset link will be sent.'
                });
            }

            const user = userResult.rows[0];

            // Generate reset token (6-digit code for simplicity)
            const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Delete any existing tokens for this user
            await DatabaseUtils.query(
                'DELETE FROM password_reset_tokens WHERE user_id = $1',
                [user.id]
            );

            // Store reset token
            await DatabaseUtils.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, resetToken, expiresAt]
            );

            // Log token to console since we don't have email service
            console.log('🔐 PASSWORD RESET TOKEN GENERATED');
            console.log('📧 Email:', email);
            console.log('🎫 Token:', resetToken);
            console.log('⏰ Expires at:', expiresAt.toISOString());
            console.log('🔗 Use this token to reset password');
            console.log('='.repeat(50));

            res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link will be sent.',
                // In development, include the token in response for testing
                ...(process.env.NODE_ENV === 'development' && {
                    debug: {
                        token: resetToken,
                        message: 'Check console for reset token (development only)'
                    }
                })
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Reset password with token
     */
    static async resetPassword(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { token, password } = req.body;

            // Find valid reset token
            const tokenResult = await DatabaseUtils.query(`
                SELECT rt.id, rt.user_id, rt.expires_at, a.email
                FROM password_reset_tokens rt
                JOIN accounts a ON rt.user_id = a.id
                WHERE rt.token = $1 AND rt.used_at IS NULL AND rt.expires_at > NOW()
            `, [token]);

            if (tokenResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            const resetData = tokenResult.rows[0];

            // Hash new password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Update password and mark token as used
            await DatabaseUtils.transaction(async (client) => {
                // Update password
                await client.query(
                    'UPDATE accounts SET password_hash = $1 WHERE id = $2',
                    [passwordHash, resetData.user_id]
                );

                // Mark token as used
                await client.query(
                    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
                    [resetData.id]
                );
            });

            console.log('✅ Password reset successful for:', resetData.email);

            res.json({
                success: true,
                message: 'Password has been reset successfully. You can now log in with your new password.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Complete the forgot password implementation
     */
    static async forgotPassword(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            // Find user by email
            const userResult = await DatabaseUtils.query(
                'SELECT id, email FROM accounts WHERE email = $1 AND is_active = true',
                [email.toLowerCase()]
            );

            // Always return success to prevent email enumeration
            if (userResult.rows.length === 0) {
                return res.json({
                    success: true,
                    message: 'If an account with that email exists, a password reset link will be sent.'
                });
            }

            const user = userResult.rows[0];

            // Generate reset token
            const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Delete any existing tokens for this user
            await DatabaseUtils.query(
                'DELETE FROM password_reset_tokens WHERE user_id = $1',
                [user.id]
            );

            // Store reset token
            await DatabaseUtils.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, resetToken, expiresAt]
            );

            // Log token to console for development (since we don't have email service)
            console.log('🔐 PASSWORD RESET TOKEN GENERATED:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${user.email}`);
            console.log(`🎫 Token: ${resetToken}`);
            console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Copy the token above and use it in the reset password form.');

            res.json({
                success: true,
                message: `Password reset token has been generated. Check the server console for the token.\n\nToken: ${resetToken}\n\nThis token will expire in 15 minutes.`,
                // Include token in response for frontend direct link (development only)
                debug: {
                    token: resetToken,
                    expiresAt: expiresAt.toISOString()
                }
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Reset password with token
     */
    static async resetPassword(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { token, password } = req.body;

            // Find valid token
            const tokenResult = await DatabaseUtils.query(`
                SELECT prt.user_id, prt.expires_at, a.email 
                FROM password_reset_tokens prt
                JOIN accounts a ON prt.user_id = a.id
                WHERE prt.token = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()
            `, [token]);

            if (tokenResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            const tokenData = tokenResult.rows[0];

            // Hash new password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Update password and mark token as used
            await DatabaseUtils.transaction(async (client) => {
                // Update password
                await client.query(
                    'UPDATE accounts SET password_hash = $1 WHERE id = $2',
                    [passwordHash, tokenData.user_id]
                );

                // Mark token as used
                await client.query(
                    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
                    [token]
                );
            });

            console.log(`✅ Password reset successful for: ${tokenData.email}`);

            res.json({
                success: true,
                message: 'Password has been reset successfully. You can now login with your new password.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Refresh JWT token
     */
    static async refreshToken(req, res) {
        try {
            const userId = req.user.userId;

            // Generate new token
            const token = jwt.sign(
                {
                    userId: req.user.userId,
                    email: req.user.email,
                    role: req.user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: { token }
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default AuthController;