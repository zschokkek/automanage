ex/**
 * Fantrax Authentication Utility
 * 
 * This utility helps authenticate with Fantrax using email and password.
 * Run this script directly to set up authentication:
 * node src/utils/fantraxAuth.js
 */

const readline = require('readline');
const FantraxService = require('../services/fantraxService');
const logger = require('./logger');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User input
 */
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Save credentials to .env file
 * @param {string} email - Fantrax email
 * @param {string} password - Fantrax password
 */
function saveCredentials(email, password) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  // Read existing .env file if it exists
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    // File doesn't exist, create new one
    envContent = '';
  }
  
  // Update or add FANTRAX_EMAIL and FANTRAX_PASSWORD
  const envLines = envContent.split('\n');
  const updatedLines = [];
  let emailFound = false;
  let passwordFound = false;
  
  for (const line of envLines) {
    if (line.startsWith('FANTRAX_EMAIL=')) {
      updatedLines.push(`FANTRAX_EMAIL=${email}`);
      emailFound = true;
    } else if (line.startsWith('FANTRAX_PASSWORD=')) {
      updatedLines.push(`FANTRAX_PASSWORD=${password}`);
      passwordFound = true;
    } else {
      updatedLines.push(line);
    }
  }
  
  if (!emailFound) {
    updatedLines.push(`FANTRAX_EMAIL=${email}`);
  }
  
  if (!passwordFound) {
    updatedLines.push(`FANTRAX_PASSWORD=${password}`);
  }
  
  // Write updated .env file
  fs.writeFileSync(envPath, updatedLines.join('\n'));
  logger.info('Fantrax credentials saved to .env file');
}

/**
 * Main function to authenticate with Fantrax
 */
async function authenticateFantrax() {
  console.log('=== Fantrax Authentication Utility ===');
  console.log('This utility will help you authenticate with Fantrax using your email and password.');
  
  try {
    // Check if credentials are already in .env
    let email = process.env.FANTRAX_EMAIL;
    let password = process.env.FANTRAX_PASSWORD;
    
    if (!email) {
      email = await promptUser('Enter your Fantrax email: ');
    } else {
      console.log(`Using email from .env: ${email}`);
      const changeEmail = await promptUser('Do you want to use a different email? (y/n): ');
      if (changeEmail.toLowerCase() === 'y') {
        email = await promptUser('Enter your Fantrax email: ');
      }
    }
    
    if (!password) {
      password = await promptUser('Enter your Fantrax password: ');
    } else {
      console.log('Using password from .env');
      const changePassword = await promptUser('Do you want to use a different password? (y/n): ');
      if (changePassword.toLowerCase() === 'y') {
        password = await promptUser('Enter your Fantrax password: ');
      }
    }
    
    // Save credentials to .env
    saveCredentials(email, password);
    
    // Test authentication
    console.log('\nTesting authentication with provided credentials...');
    const fantraxService = new FantraxService({ email, password });
    const isConnected = await fantraxService.testConnection();
    
    if (isConnected) {
      console.log('✅ Authentication successful!');
      
      // Test getting leagues
      try {
        const leagues = await fantraxService.getUserLeagues();
        console.log(`\nFound ${leagues.length} leagues:`);
        leagues.forEach((league, index) => {
          console.log(`${index + 1}. ${league.name} (ID: ${league.id})`);
        });
      } catch (error) {
        console.log('\nAuthenticated successfully, but failed to fetch leagues.');
        console.log(`Error: ${error.message}`);
      }
    } else {
      console.log('❌ Authentication failed. Please check your credentials and try again.');
    }
  } catch (error) {
    console.error(`Error during authentication: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the authentication if this script is executed directly
if (require.main === module) {
  authenticateFantrax();
}

module.exports = {
  authenticateFantrax
};
