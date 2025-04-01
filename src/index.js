require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import utilities
const logger = require('./utils/logger');
const connectDB = require('./utils/database');
const ensureDirectories = require('./utils/ensureDirectories');

// Import routes
const authRoutes = require('./api/auth');
const leagueRoutes = require('./api/leagues');
const analysisRoutes = require('./api/analysis');
const importRoutes = require('./api/import');

// Ensure required directories exist
ensureDirectories();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB().then(() => {
  logger.info('Database connection established');
}).catch(err => {
  logger.error(`Database connection error: ${err.message}`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fantasy-analyzer-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/import', importRoutes);

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Open http://localhost:${PORT} in your browser`);
});

module.exports = app;
