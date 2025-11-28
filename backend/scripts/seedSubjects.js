import DatabaseUtils from '../src/utils/database.js';

const defaultSubjects = [
    { name: 'Mathematics', description: 'General mathematics and algebra', category: 'academic' },
    { name: 'Physics', description: 'Classical and modern physics', category: 'academic' },
    { name: 'Chemistry', description: 'Organic and inorganic chemistry', category: 'academic' },
    { name: 'Computer Science', description: 'Programming and software development', category: 'academic' },
    { name: 'Biology', description: 'Life sciences and molecular biology', category: 'academic' },
    { name: 'English', description: 'Literature and language arts', category: 'academic' },
    { name: 'History', description: 'World and American history', category: 'academic' },
    { name: 'Economics', description: 'Micro and macroeconomics', category: 'academic' },
    { name: 'Psychology', description: 'Cognitive and behavioral psychology', category: 'academic' },
    { name: 'Statistics', description: 'Statistical analysis and data science', category: 'academic' },
    { name: 'Calculus', description: 'Differential and integral calculus', category: 'academic' },
    { name: 'Spanish', description: 'Spanish language and culture', category: 'language' },
    { name: 'French', description: 'French language and culture', category: 'language' },
    { name: 'Art', description: 'Visual arts and design', category: 'creative' },
    { name: 'Music', description: 'Music theory and performance', category: 'creative' }
];

async function seedSubjects() {
    try {
        console.log('🌱 Starting to seed subjects...');

        // Check if subjects already exist
        const existingSubjects = await DatabaseUtils.query('SELECT COUNT(*) FROM subjects');
        const subjectCount = parseInt(existingSubjects.rows[0].count);

        if (subjectCount > 0) {
            console.log(`📊 Found ${subjectCount} existing subjects. Skipping seed.`);
            return;
        }

        // Insert default subjects
        for (const subject of defaultSubjects) {
            await DatabaseUtils.query(
                'INSERT INTO subjects (name, description, category) VALUES ($1, $2, $3)',
                [subject.name, subject.description, subject.category]
            );
            console.log(`✅ Added subject: ${subject.name}`);
        }

        console.log(`🎉 Successfully seeded ${defaultSubjects.length} subjects!`);

    } catch (error) {
        console.error('❌ Error seeding subjects:', error);
        throw error;
    }
}

// Run the seed function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedSubjects()
        .then(() => {
            console.log('✨ Subject seeding complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Subject seeding failed:', error);
            process.exit(1);
        });
}

export { seedSubjects };