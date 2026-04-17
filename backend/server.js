const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const app = express();
const PORT = process.env.PORT || 3306;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/predictions', predictionRoutes);

// Status Route
app.get('/api/status', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'Database connected successfully' });
    } catch (error) {
        res.status(500).json({ status: 'Database connection failed', error: error.message });
    }
});

// วางไว้ก่อนบรรทัด app.listen
app.on('error', (err) => {
    console.error('Server error:', err);
});

// แก้ไขจุด listen เพื่อดูว่ามี error หรือไม่
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. ลองเปลี่ยนเลข Port ดูนะ!`);
  } else {
    console.error('Server error:', err);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
