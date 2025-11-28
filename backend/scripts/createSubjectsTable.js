import { pool } from '../config/database.js';

const createSubjectsTable = async () => {
    const client = await pool.connect();
    try {
        // Drop existing table if it exists
        await client.query(`DROP TABLE IF EXISTS subjects CASCADE;`);

        // Create subjects table
        await client.query(`
      CREATE TABLE subjects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50) NOT NULL DEFAULT 'academic',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create indexes
        await client.query(`
      CREATE INDEX idx_subjects_name ON subjects(name);
      CREATE INDEX idx_subjects_category ON subjects(category);
    `);

        // Insert default subjects
        const defaultSubjects = [
            { name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics', category: 'stem' },
            { name: 'Physics', description: 'Mechanics, Thermodynamics, Electromagnetism', category: 'stem' },
            { name: 'Chemistry', description: 'Organic, Inorganic, Physical Chemistry', category: 'stem' },
            { name: 'Biology', description: 'Cell Biology, Genetics, Ecology, Anatomy', category: 'stem' },
            { name: 'Computer Science', description: 'Programming, Data Structures, Algorithms', category: 'stem' },
            { name: 'English', description: 'Literature, Writing, Grammar, Composition', category: 'language' },
            { name: 'History', description: 'World History, American History, European History', category: 'social' },
            { name: 'Geography', description: 'Physical Geography, Human Geography, Cartography', category: 'social' },
            { name: 'Economics', description: 'Microeconomics, Macroeconomics, Finance', category: 'social' },
            { name: 'Psychology', description: 'Cognitive Psychology, Social Psychology, Developmental', category: 'social' },
            { name: 'Spanish', description: 'Spanish Language, Literature, Culture', category: 'language' },
            { name: 'French', description: 'French Language, Literature, Culture', category: 'language' },
            { name: 'Art', description: 'Drawing, Painting, Digital Art, Art History', category: 'creative' },
            { name: 'Music', description: 'Music Theory, Composition, Performance', category: 'creative' },
            { name: 'Philosophy', description: 'Ethics, Logic, Metaphysics, Political Philosophy', category: 'humanities' },
            { name: 'Statistics', description: 'Descriptive Statistics, Inferential Statistics, Data Analysis', category: 'stem' },
            { name: 'Business', description: 'Management, Marketing, Entrepreneurship', category: 'business' },
            { name: 'Accounting', description: 'Financial Accounting, Managerial Accounting', category: 'business' },
            { name: 'Other', description: 'Miscellaneous subjects not listed above', category: 'general' }
        ];

        for (const subject of defaultSubjects) {
            await client.query(`
        INSERT INTO subjects (name, description, category) 
        VALUES ($1, $2, $3)
      `, [subject.name, subject.description, subject.category]);
        }

        console.log('✅ Subjects table created successfully');
        console.log(`📚 Inserted ${defaultSubjects.length} default subjects`);

        // Show subjects by category
        const categorySummary = await client.query(`
      SELECT category, COUNT(*) as count, array_agg(name ORDER BY name) as subjects
      FROM subjects 
      GROUP BY category
      ORDER BY category
    `);

        console.log('📊 Subjects by Category:');
        categorySummary.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} subjects`);
            console.log(`     ${row.subjects.join(', ')}`);
        });

    } catch (error) {
        console.error('❌ Error creating subjects table:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

createSubjectsTable();