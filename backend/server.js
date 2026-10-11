const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { initCronJobs } = require('./utils/cron');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Share socket.io reference to Express routes
app.set('socketio', io);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Pizza Delivery Full-Stack API is running...');
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins a personal room based on their User ID for targeted status tracking updates
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room: ${userId}`);
  });

  // Admin joins admin notification room
  socket.on('joinAdminRoom', () => {
    socket.join('adminRoom');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to Database and start server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pizza-delivery';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Initialize Cron Jobs for low stock checks
      initCronJobs();
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
