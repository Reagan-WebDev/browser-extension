require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitor');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For extension dev, allow all temporarily. Change to specific origins in prod.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Parse JSON bodies
// IMPORTANT: Increase payload limit if extension sends huge batch of logs
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/api', monitorRoutes);

// Health check
app.get('/', (req, res) => res.send('API is running for Browser Monitor'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
