#!/usr/bin/env node

/**
 * Fantasy Football Analyzer Startup Script
 * 
 * This script starts the Fantasy Football Analyzer application
 * and handles graceful shutdown.
 */

// Load environment variables
require('dotenv').config();

// Import the application
const app = require('./src/index');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running, but log the error
});

// Log startup message
console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║             Fantasy Football Analyzer              ║
║                                                    ║
║  Get weekly insights for your fantasy teams        ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`);

console.log('Application started successfully!');
console.log(`Server running at: http://localhost:${process.env.PORT || 3000}`);
console.log('Press Ctrl+C to stop the server');
