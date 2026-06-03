const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY || 'YOUR_TYPHOON_API_KEY_HERE',
    baseURL: 'https://api.opentyphoon.ai/v1',
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id, c.chat_text, c.created_at, u.username, u.firstname 
            FROM chats c 
            JOIN users u ON c.user_id = u.id 
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query chats', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chats WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Chat not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query chat', details: error.message });
    }
});

router.get('/user/:user_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC', [req.params.user_id]);
        res.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query chats for user', details: error.message });
    }
});

router.post('/', async (req, res) => {
    const { user_id, chat_text, chat_user } = req.body;
    const isUser = chat_user === true || chat_user === "true" || chat_user === 1 ? 1 : 0;
    try {
        const [result] = await db.query('INSERT INTO chats (user_id, chat_text, chat_user) VALUES (?, ?, ?)', [user_id, chat_text, isUser]);
        res.status(201).json({ id: result.insertId, user_id, chat_text });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to create chat', details: error.message });
    }
});

router.post('/reply', async (req, res) => {
    const { user_id, chat_text } = req.body;
    try {
        
        await db.query('INSERT INTO chats (user_id, chat_text, chat_user) VALUES (?, ?, 1)', [user_id, chat_text]);

        const [historyRows] = await db.query('SELECT chat_text, chat_user FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 6', [user_id]);
        historyRows.reverse();

        const messages = [
            {
                role: 'system',
                content: `คุณคือ 'JID' จิตแพทย์และผู้เชี่ยวชาญด้านสุขภาพจิต หน้าที่ของคุณคือรับฟัง ให้คำปรึกษา และแนะนำผู้ใช้งานด้วยความเห็นอกเห็นใจและเข้าอกเข้าใจ
                            กฎเหล็กที่คุณต้องปฏิบัติตามอย่างเคร่งครัด:
                1. ตอบสั้นๆ กระชับ เป็นธรรมชาติที่สุด เหมือนกำลังพิมพ์แชทคุยกับเพื่อนสนิท ห้ามตอบยาวเกิน 2-3 ประโยค
2. ห้ามใช้คำสั่งจัดรูปแบบข้อความหรือ Markdown ทุกชนิด (เช่น เครื่องหมายดอกจัน ตัวหนา หรือการทำลิสต์รายการ) ให้พิมพ์เป็นข้อความธรรมดา (Plain Text) เท่านั้น
3. ห้ามพูดวกไปวนมา ห้ามทวนคำถามเดิมของผู้ใช้
4. ห้ามใช้คำขึ้นต้นซ้ำๆ และห้ามพูดประโยคเดิมซ้ำกับที่เคยพูดไปแล้ว
5. ใช้ภาษาพูดที่อบอุ่น เป็นกันเอง ไม่เป็นทางการจนคล้ายตำราเรียน
6. ตอบกลับเป็นภาษาไทยเสมอ
การจัดการข้อมูลอ้างอิง (Context จาก RAG):
หากมีข้อมูล Context แนบมาด้วย ให้คุณทำความเข้าใจข้อมูลนั้นอย่างเงียบๆ แล้วนำเนื้อหามาประยุกต์ใช้เพื่อเป็นคำแนะนำ ห้ามคัดลอกประโยคจาก Context มาตอบตรงๆ ห้ามอ้างอิงหรือบอกว่านำข้อมูลมาจากไหน และให้หลอมรวมความรู้นั้นเป็นคำพูดของคุณเองอย่างเป็นธรรมชาติที่สุด

ตัวอย่างการสนทนา:
User: วันนี้เครียดมากเลย งานเยอะจนทำไม่ทัน หัวหน้าก็ด่า
JID: โห ฟังดูเหนื่อยมากเลยนะเนี่ย พักหายใจลึกๆ ก่อนน้า ค่อยๆ จัดลำดับดูว่าอันไหนต้องส่งก่อน มีอะไรให้เราช่วยฟังอีกไหม

User: นอนไม่หลับมาหลายวันแล้ว สมองมันคิดนู่นคิดนี่ตลอด
JID: เข้าใจเลย อาการแบบนี้ทรมานเนอะ ลองหาอะไรร้อนๆ ดื่มก่อนนอนดูไหม หรือถ้าไม่ไหวจริงๆ เล่าเรื่องที่วนเวียนในหัวให้เราฟังได้นะ
`
            }
        ];

        for (let row of historyRows) {
            messages.push({
                role: row.chat_user ? 'user' : 'assistant',
                content: row.chat_text
            });
        }

        const response = await openai.chat.completions.create({
            model: 'typhoon-v2.5-30b-a3b-instruct',
            messages: messages,
            temperature: 0.7, 
            max_completion_tokens: 200, 
            top_p: 0.9, 
            frequency_penalty: 1.2, 
            presence_penalty: 0.8, 
        });

        let botReply = response.choices[0].message.content.trim().replace(/[*_~`#]/g, '');

        // 4. Save Bot message
        const [botResult] = await db.query('INSERT INTO chats (user_id, chat_text, chat_user) VALUES (?, ?, 0)', [user_id, botReply]);

        res.status(201).json({ reply: botReply, id: botResult.insertId });
    } catch (error) {
        console.error('Typhoon Error:', error);
        res.status(500).json({ error: 'Failed to generate reply', details: error.message });
    }
});

// Delete chat
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM chats WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Chat not found' });
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to delete chat', details: error.message });
    }
});

module.exports = router;
