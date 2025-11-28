// Type definitions as JSDoc comments for better development experience

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'student' | 'tutor'} role
 * @property {string} [avatar]
 * @property {string} createdAt
 */

/**
 * @typedef {User} Student
 * @property {'student'} role
 * @property {Object} progress
 * @property {number} progress.completedTasks
 * @property {number} progress.totalTasks
 * @property {number} progress.currentStreak
 * @property {number} progress.totalHours
 * @property {Object} preferences
 * @property {string[]} preferences.subjects
 * @property {string} preferences.learningStyle
 * @property {string[]} preferences.availability
 */

/**
 * @typedef {User} Tutor
 * @property {'tutor'} role
 * @property {number} rating
 * @property {string[]} subjects
 * @property {number} hourlyRate
 * @property {Object} availability
 * @property {string} bio
 * @property {number} experience
 * @property {number} totalSessions
 * @property {string} responseTime
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} subject
 * @property {'pending' | 'in-progress' | 'completed'} status
 * @property {number} progress
 * @property {string} dueDate
 * @property {string} createdAt
 * @property {number} estimatedHours
 */

/**
 * @typedef {Object} BookingSlot
 * @property {string} id
 * @property {string} tutorId
 * @property {string} date
 * @property {string} startTime
 * @property {string} endTime
 * @property {boolean} isAvailable
 * @property {number} price
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} studentId
 * @property {string} tutorId
 * @property {string} slotId
 * @property {string} subject
 * @property {'pending' | 'confirmed' | 'completed' | 'cancelled'} status
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} scheduledAt
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} content
 * @property {'user' | 'ai'} sender
 * @property {string} timestamp
 */

/**
 * @typedef {Object} AIAssistantResponse
 * @property {string} message
 * @property {string[]} [suggestions]
 * @property {Array<{title: string, url: string, type: 'video' | 'article' | 'exercise'}>} [resources]
 */

export { };