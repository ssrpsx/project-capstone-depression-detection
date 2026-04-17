const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Fetching all chats...');
        const [rows] = await connection.query('SELECT id, chat_text FROM chats');
        
        let fixedCount = 0;
        for (const row of rows) {
            let isUser = 1;
            // Let's be extremely liberal with matching the Mock Response
            if (row.chat_text && (row.chat_text.includes('Mock Response') || row.chat_text.includes('AI Mock') || row.chat_text.includes('ฉันยินดีรับฟัง'))) {
                isUser = 0;
            }
            
            await connection.query('UPDATE chats SET chat_user = ? WHERE id = ?', [isUser, row.id]);
            fixedCount++;
        }
        
        console.log(`Chat history fixed successfully! Updated ${fixedCount} rows.`);

        // Verification step
        const [check] = await connection.query('SELECT chat_text, chat_user FROM chats ORDER BY id DESC LIMIT 5');
        console.log('Recent 5 chats verification:', check);

    } catch (err) {
        console.error('Error fixing db:', err);
    } finally {
        await connection.end();
    }
}

run();
