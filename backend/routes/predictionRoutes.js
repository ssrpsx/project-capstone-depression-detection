const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all predictions
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id as prediction_id, 
                c.chat_text, 
                p.result, 
                p.probability, 
                p.predicted_at,
                u.username,
                u.firstname
            FROM predictions p
            JOIN chats c ON p.chat_id = c.id
            JOIN users u ON c.user_id = u.id
            ORDER BY p.predicted_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query predictions', details: error.message });
    }
});

// Get prediction by id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM predictions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Prediction not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query prediction', details: error.message });
    }
});

// Create new prediction
router.post('/', async (req, res) => {
    const { chat_id, result, probability } = req.body;
    try {
        const [dbResult] = await db.query('INSERT INTO predictions (chat_id, result, probability) VALUES (?, ?, ?)', [chat_id, result, probability]);
        res.status(201).json({ id: dbResult.insertId, chat_id, result, probability });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to create prediction', details: error.message });
    }
});

// Delete prediction
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM predictions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Prediction not found' });
        res.json({ message: 'Prediction deleted successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to delete prediction', details: error.message });
    }
});

module.exports = router;
