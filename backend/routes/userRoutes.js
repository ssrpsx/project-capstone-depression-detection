const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Get all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, firstname, lastname, username, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query users', details: error.message });
    }
});

// Get user by id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, firstname, lastname, username, created_at FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query user', details: error.message });
    }
});

// Create new user
router.post('/', async (req, res) => {
    const { firstname, lastname, username, password } = req.body;
    try {
        const [result] = await db.query('INSERT INTO users (firstname, lastname, username, password) VALUES (?, ?, ?, ?)', [firstname, lastname, username, password]);
        res.status(201).json({ id: result.insertId, firstname, lastname, username });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { firstname, lastname, username } = req.body;
    try {
        const [result] = await db.query('UPDATE users SET firstname = ?, lastname = ?, username = ? WHERE id = ?', [firstname, lastname, username, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '2h' }
        );
        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to login', details: error.message });
    }
});

module.exports = router;
