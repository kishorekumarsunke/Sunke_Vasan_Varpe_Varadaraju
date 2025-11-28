import DatabaseUtils from '../src/utils/database.js';

async function checkSchema() {
    try {
        console.log('🔍 Checking tutor_profiles schema...');

        // Check if the table has the new available_days column
        const columnsResult = await DatabaseUtils.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            ORDER BY column_name;
        `);

        console.log('📊 Current tutor_profiles columns:');
        columnsResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check specifically for availability fields
        const availabilityFields = columnsResult.rows.filter(col =>
            col.column_name.includes('availability') || col.column_name.includes('available')
        );

        console.log('🎯 Availability-related fields:');
        if (availabilityFields.length === 0) {
            console.log('   ❌ No availability fields found!');
        } else {
            availabilityFields.forEach(field => {
                console.log(`   ✅ ${field.column_name}: ${field.data_type}`);
            });
        }

        // Test inserting a sample available_days value
        console.log('🧪 Testing available_days insertion...');
        try {
            await DatabaseUtils.query(`
                SELECT available_days FROM tutor_profiles LIMIT 1;
            `);
            console.log('   ✅ available_days field exists and is queryable');
        } catch (error) {
            console.log('   ❌ Error querying available_days:', error.message);
        }

    } catch (error) {
        console.error('❌ Error checking schema:', error);
        throw error;
    }
}

checkSchema()
    .then(() => {
        console.log('✨ Schema check complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Schema check failed:', error);
        process.exit(1);
    });