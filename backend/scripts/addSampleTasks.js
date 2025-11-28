import { pool } from '../config/database.js';

const addSampleTasks = async () => {
    const client = await pool.connect();
    try {
        // Get a user ID to associate tasks with (we'll use the first student account)
        const userResult = await client.query(`
      SELECT id FROM accounts WHERE account_type = 'student' LIMIT 1
    `);

        if (userResult.rows.length === 0) {
            console.log('❌ No student account found. Please create a student account first.');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('👤 Using user ID:', userId);

        // Sample tasks data
        const sampleTasks = [
            {
                title: 'Complete Calculus Assignment',
                description: 'Solve problems 1-20 from Chapter 5 on derivatives and integrals',
                subject: 'Mathematics',
                priority: 'high',
                estimated_time: '3 hours',
                due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                status: 'pending',
                progress: 0
            },
            {
                title: 'Physics Lab Report',
                description: 'Write a comprehensive report on the momentum conservation experiment',
                subject: 'Physics',
                priority: 'medium',
                estimated_time: '2 hours',
                due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                status: 'started',
                progress: 25
            },
            {
                title: 'Read Chemistry Chapter 8',
                description: 'Read and take notes on chemical bonding and molecular structure',
                subject: 'Chemistry',
                priority: 'low',
                estimated_time: '1.5 hours',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: 'pending',
                progress: 0
            },
            {
                title: 'Computer Science Project',
                description: 'Build a simple web application using React and Node.js',
                subject: 'Computer Science',
                priority: 'high',
                estimated_time: '8 hours',
                due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                status: 'in-progress',
                progress: 60
            },
            {
                title: 'English Essay Draft',
                description: 'Write a 5-page essay on Shakespeare\'s use of symbolism in Hamlet',
                subject: 'English',
                priority: 'medium',
                estimated_time: '4 hours',
                due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                status: 'completed',
                progress: 100
            },
            {
                title: 'History Research Paper',
                description: 'Research and outline paper on the causes of World War I',
                subject: 'History',
                priority: 'medium',
                estimated_time: '6 hours',
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                status: 'pending',
                progress: 0
            },
            {
                title: 'Biology Study Session',
                description: 'Review cellular respiration and photosynthesis for upcoming exam',
                subject: 'Biology',
                priority: 'high',
                estimated_time: '2 hours',
                due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
                status: 'started',
                progress: 40
            },
            {
                title: 'Psychology Case Study',
                description: 'Analyze the case study on cognitive behavioral therapy effectiveness',
                subject: 'Psychology',
                priority: 'low',
                estimated_time: '2.5 hours',
                due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
                status: 'pending',
                progress: 0
            }
        ];

        // Insert sample tasks
        for (const task of sampleTasks) {
            await client.query(`
        INSERT INTO tasks (
          user_id, title, description, subject, priority, 
          estimated_time, due_date, status, progress
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
                userId, task.title, task.description, task.subject,
                task.priority, task.estimated_time, task.due_date,
                task.status, task.progress
            ]);
        }

        console.log(`✅ Successfully added ${sampleTasks.length} sample tasks for user ${userId}`);

        // Show summary
        const summary = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(progress) as avg_progress
      FROM tasks 
      WHERE user_id = $1 
      GROUP BY status
    `, [userId]);

        console.log('📊 Task Summary:');
        summary.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} tasks (avg progress: ${Math.round(row.avg_progress)}%)`);
        });

    } catch (error) {
        console.error('❌ Error adding sample tasks:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

addSampleTasks();