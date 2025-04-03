/**
 * Public League Data Utility
 * 
 * This utility demonstrates how to get public league data from Fantrax without authentication.
 * Run this script directly with a league ID:
 * node src/utils/getPublicLeagueData.js <leagueId>
 */

const FantraxService = require('../services/fantraxService');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * Get public league data and save to file
 * @param {string} leagueId - Fantrax league ID
 */
async function getAndSavePublicLeagueData(leagueId) {
  if (!leagueId) {
    console.error('Error: League ID is required');
    console.log('Usage: node src/utils/getPublicLeagueData.js <leagueId>');
    process.exit(1);
  }

  console.log(`Fetching public data for league ID: ${leagueId}`);
  
  try {
    // Create Fantrax service without authentication
    const fantraxService = new FantraxService();
    
    // Get public league data
    const leagueData = await fantraxService.getPublicLeagueData(leagueId);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data', 'leagues');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save league data to file
    const filePath = path.join(dataDir, `${leagueId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(leagueData, null, 2));
    
    console.log(`✅ Public league data saved to ${filePath}`);
    
    // Display some basic league info
    console.log('\nLeague Information:');
    console.log(`Name: ${leagueData.leagueInfo.name}`);
    console.log(`Sport: ${leagueData.leagueInfo.sport}`);
    console.log(`Season: ${leagueData.leagueInfo.season}`);
    
    console.log('\nTeams:');
    leagueData.teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (Owner: ${team.ownerName || 'Unknown'})`);
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  const leagueId = process.argv[2];
  getAndSavePublicLeagueData(leagueId);
}

module.exports = {
  getAndSavePublicLeagueData
};
