const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all chats
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

// Get chat by id
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

// Get chats by user_id
router.get('/user/:user_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC', [req.params.user_id]);
        res.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query chats for user', details: error.message });
    }
});

// Create new chat
router.post('/', async (req, res) => {
    const { user_id, chat_text } = req.body;
    try {
        const [result] = await db.query('INSERT INTO chats (user_id, chat_text) VALUES (?, ?)', [user_id, chat_text]);
        res.status(201).json({ id: result.insertId, user_id, chat_text });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to create chat', details: error.message });
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
