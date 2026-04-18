const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
        const [rows] = await db.query('SELECT id, firstname, lastname, username, phone, profile_picture, created_at FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to query user', details: error.message });
    }
});

// Create new user
router.post('/', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.status(201).json({ id: result.insertId, username });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { firstname, lastname, username, phone } = req.body;
    try {
        const [result] = await db.query('UPDATE users SET firstname = ?, lastname = ?, username = ?, phone = ? WHERE id = ?', [firstname, lastname, username, phone, req.params.id]);
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
        // Optional: delete profile picture file from disk if exists
        const [userRows] = await db.query('SELECT profile_picture FROM users WHERE id = ?', [req.params.id]);
        if (userRows.length > 0 && userRows[0].profile_picture) {
            const filePath = userRows[0].profile_picture;
            // filePath might be something like uploads/filename.jpg
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// Upload profile picture
router.post('/upload-profile-pic/:id', upload.single('profile_picture'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    const filePath = `uploads/${req.file.filename}`;
    try {
        // Delete old picture if exists
        const [rows] = await db.query('SELECT profile_picture FROM users WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].profile_picture) {
            const oldPath = rows[0].profile_picture;
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [filePath, req.params.id]);
        res.json({ message: 'Profile picture updated successfully', filePath: filePath });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to update profile picture', details: error.message });
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

// Change user password
router.put('/change-password/:id', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Please provide both old and new passwords' });
    }

    try {
        // Find user by ID
        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];

        // Verify old password
        if (user.password !== oldPassword) {
            return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        // Update with new password
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.params.id]);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to update password', details: error.message });
    }
});

module.exports = router;
