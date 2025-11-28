import DatabaseUtils from '../src/utils/database.js';

async function migrateAvailability() {
    try {
        console.log('🔄 Starting availability field migration...');

        // First, check current state
        console.log('🔍 Checking current tutor_profiles structure...');
        const columnsResult = await DatabaseUtils.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            AND (column_name LIKE '%availability%' OR column_name LIKE '%available%')
            ORDER BY column_name;
        `);

        console.log('📊 Current availability-related columns:');
        columnsResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        const hasAvailabilityHours = columnsResult.rows.some(col => col.column_name === 'availability_hours');
        const hasAvailableDays = columnsResult.rows.some(col => col.column_name === 'available_days');

        if (!hasAvailabilityHours && hasAvailableDays) {
            console.log('✅ Migration already completed! available_days exists and availability_hours is gone.');
            return;
        }

        if (hasAvailableDays) {
            console.log('✅ available_days column already exists');
        } else {
            // Add the new available_days column
            console.log('➕ Adding available_days column...');
            await DatabaseUtils.query(`
                ALTER TABLE tutor_profiles 
                ADD COLUMN available_days text[] DEFAULT '{}';
            `);
            console.log('✅ Added available_days column');
        }

        if (hasAvailabilityHours) {
            // Migrate data from availability_hours to available_days (if any)
            console.log('🔄 Migrating data from availability_hours to available_days...');

            const dataResult = await DatabaseUtils.query(`
                SELECT id, availability_hours 
                FROM tutor_profiles 
                WHERE availability_hours IS NOT NULL;
            `);

            for (const row of dataResult.rows) {
                try {
                    if (row.availability_hours && typeof row.availability_hours === 'object') {
                        // Extract days from JSON object
                        const days = Object.keys(row.availability_hours);
                        await DatabaseUtils.query(`
                            UPDATE tutor_profiles 
                            SET available_days = $2 
                            WHERE id = $1;
                        `, [row.id, days]);
                        console.log(`   ✅ Migrated data for profile ${row.id}: ${days.join(', ')}`);
                    }
                } catch (e) {
                    console.log(`   ⚠️ Could not migrate data for profile ${row.id}:`, e.message);
                }
            }

            // Drop the old availability_hours column
            console.log('🗑️ Dropping old availability_hours column...');
            await DatabaseUtils.query(`
                ALTER TABLE tutor_profiles 
                DROP COLUMN availability_hours;
            `);
            console.log('✅ Dropped availability_hours column');
        }

        // Verify the final state
        console.log('🔍 Verifying final structure...');
        const finalResult = await DatabaseUtils.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            AND (column_name LIKE '%availability%' OR column_name LIKE '%available%')
            ORDER BY column_name;
        `);

        console.log('📊 Final availability-related columns:');
        finalResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

migrateAvailability()
    .then(() => {
        console.log('✨ Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });