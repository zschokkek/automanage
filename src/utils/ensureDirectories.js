const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Ensure that required directories exist
 */
function ensureDirectories() {
  const directories = [
    path.join(__dirname, '../../logs'),
    path.join(__dirname, '../../data')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (error) {
        logger.error(`Error creating directory ${dir}: ${error.message}`);
      }
    }
  });
}

module.exports = ensureDirectories;
