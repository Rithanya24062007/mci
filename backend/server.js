const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const publicRoutes = require('./routes/publicRoutes');
const customerRoutes = require('./routes/customerRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint (must be before protected routes)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Queue Management API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes - Order matters for specificity
app.use('/', authRoutes);             // /login
app.use('/customer', customerRoutes); // /customer/*
app.use('/public', publicRoutes);     // /public/*
app.use('/staff', staffRoutes);       // /staff/queue, /staff/next
app.use('/admin', adminRoutes);       // /admin/*
app.use('/device', deviceRoutes);     // /device/event (ESP32)

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server — bind 0.0.0.0 so ESP32 and other LAN devices can connect
app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log('Queue Management System - Backend');
    console.log('=================================');
    console.log(`Server running on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('=================================');
});

module.exports = app;
