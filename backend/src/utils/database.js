import { pool } from '../../config/database.js';

/**
 * Database utility functions for common operations
 */
class DatabaseUtils {
    /**
     * Execute a query with parameters
     * @param {string} text - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    static async query(text, params = []) {
        const client = await pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Function containing queries to execute in transaction
     * @returns {Promise<any>} Transaction result
     */
    static async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get a single row by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {string} idColumn - ID column name (default: 'id')
     * @returns {Promise<Object|null>} Record or null if not found
     */
    static async findById(table, id, idColumn = 'id') {
        const query = `SELECT * FROM ${table} WHERE ${idColumn} = $1`;
        const result = await this.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Insert a new record
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Inserted record
     */
    static async insert(table, data) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const query = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING *
        `;

        const result = await this.query(query, values);
        return result.rows[0];
    }

    /**
     * Update a record by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {Object} data - Data to update
     * @param {string} idColumn - ID column name (default: 'id')
     * @returns {Promise<Object|null>} Updated record or null if not found
     */
    static async updateById(table, id, data, idColumn = 'id') {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, index) => `${col} = $${index + 2}`);

        const query = `
            UPDATE ${table}
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE ${idColumn} = $1
            RETURNING *
        `;

        const result = await this.query(query, [id, ...values]);
        return result.rows[0] || null;
    }

    /**
     * Delete a record by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {string} idColumn - ID column name (default: 'id')
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    static async deleteById(table, id, idColumn = 'id') {
        const query = `DELETE FROM ${table} WHERE ${idColumn} = $1`;
        const result = await this.query(query, [id]);
        return result.rowCount > 0;
    }

    /**
     * Check if a record exists
     * @param {string} table - Table name
     * @param {Object} conditions - Conditions to check
     * @returns {Promise<boolean>} True if exists, false otherwise
     */
    static async exists(table, conditions) {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`);

        const query = `SELECT 1 FROM ${table} WHERE ${whereClause.join(' AND ')} LIMIT 1`;
        const result = await this.query(query, values);
        return result.rows.length > 0;
    }

    /**
     * Get paginated results
     * @param {string} table - Table name
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated results
     */
    static async paginate(table, options = {}) {
        const {
            page = 1,
            limit = 10,
            orderBy = 'created_at',
            orderDirection = 'DESC',
            where = '',
            whereParams = []
        } = options;

        const offset = (page - 1) * limit;
        const whereClause = where ? `WHERE ${where}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM ${table} ${whereClause}`;
        const countResult = await this.query(countQuery, whereParams);
        const total = parseInt(countResult.rows[0].count);

        // Get paginated data
        const dataQuery = `
            SELECT * FROM ${table} 
            ${whereClause}
            ORDER BY ${orderBy} ${orderDirection}
            LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
        `;
        const dataResult = await this.query(dataQuery, [...whereParams, limit, offset]);

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }
}

export default DatabaseUtils;