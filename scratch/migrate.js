const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function migrate() {
    try {
        console.log('Checking columns...');
        const [columns] = await db.query('SHOW COLUMNS FROM users');
        const hasPhone = columns.some(col => col.Field === 'phone');
        
        if (!hasPhone) {
            console.log('Adding phone column...');
            await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER password');
            console.log('Column added successfully.');
        } else {
            console.log('Phone column already exists.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
