/**
 * Fantrax API Test with Cookie Authentication
 * 
 * This script demonstrates how to authenticate with Fantrax using cookies
 * extracted from a browser session and use them to access the API.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LEAGUE_ID = 'vehodfr1m8ne179d';
const COOKIE_FILE = path.join(__dirname, 'fantrax_cookies.json');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Save cookies to a file
 * @param {Object} cookies - Cookie object
 * @param {string} filename - File to save cookies to
 */
function saveCookies(cookies, filename = COOKIE_FILE) {
  fs.writeFileSync(filename, JSON.stringify(cookies, null, 2));
  console.log(`Cookies saved to ${filename}`);
}

/**
 * Load cookies from a file
 * @param {string} filename - File to load cookies from
 * @returns {Object|null} - Cookie object or null if file doesn't exist
 */
function loadCookies(filename = COOKIE_FILE) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    return null;
  }
}

/**
 * Create an API client with cookies
 * @param {Object} cookies - Cookie object
 * @returns {Object} - Axios instance
 */
function createApiClient(cookies) {
  // Convert cookie object to cookie string
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

  return axios.create({
    baseURL: 'https://www.fantrax.com/api/v3',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
}

/**
 * Get user's leagues
 * @param {Object} apiClient - Axios instance
 * @returns {Promise<Array>} - List of leagues
 */
async function getUserLeagues(apiClient) {
  try {
    const response = await apiClient.get('/leagues', {
      params: {
        sport: 'NFL',
        view: 'CURRENT_SEASON'
      }
    });
    
    return response.data.leagues || [];
  } catch (error) {
    console.error(`Error fetching leagues: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Get league details
 * @param {Object} apiClient - Axios instance
 * @param {string} leagueId - Fantrax league ID
 * @returns {Promise<Object>} - League details
 */
async function getLeagueDetails(apiClient, leagueId) {
  try {
    const response = await apiClient.get(`/leagues/${leagueId}`);
    return response.data || {};
  } catch (error) {
    console.error(`Error fetching league details: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return {};
  }
}

/**
 * Get league teams
 * @param {Object} apiClient - Axios instance
 * @param {string} leagueId - Fantrax league ID
 * @returns {Promise<Array>} - List of teams
 */
async function getLeagueTeams(apiClient, leagueId) {
  try {
    const response = await apiClient.get(`/leagues/${leagueId}/teams`);
    return response.data.teams || [];
  } catch (error) {
    console.error(`Error fetching league teams: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Get league standings
 * @param {Object} apiClient - Axios instance
 * @param {string} leagueId - Fantrax league ID
 * @returns {Promise<Object>} - League standings
 */
async function getLeagueStandings(apiClient, leagueId) {
  try {
    const response = await apiClient.get(`/leagues/${leagueId}/standings`);
    return response.data || {};
  } catch (error) {
    console.error(`Error fetching league standings: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return {};
  }
}

/**
 * Main function to test Fantrax API
 */
async function testFantraxApi() {
  console.log(`Testing Fantrax API with league ID: ${LEAGUE_ID}`);
  
  // Load cookies or prompt user to enter them
  let cookies = loadCookies();
  
  if (!cookies) {
    console.log('\nNo cookies found. Please follow these steps to get your Fantrax cookies:');
    console.log('1. Log in to Fantrax in your browser');
    console.log('2. Open developer tools (F12 or right-click -> Inspect)');
    console.log('3. Go to the "Application" or "Storage" tab');
    console.log('4. Find "Cookies" in the left sidebar and click on "https://www.fantrax.com"');
    console.log('5. Look for cookies like "JSESSIONID", "X-AUTH-TOKEN", etc.');
    console.log('6. Paste the entire cookie string from your browser below');
    console.log('   (You can copy this from the Network tab, find a request to fantrax.com,');
    console.log('    and copy the "Cookie" header from the request headers)');
    
    rl.question('\nPaste your cookie string: ', (cookieString) => {
      // Parse cookie string into object
      const cookieObj = {};
      cookieString.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          cookieObj[key] = value;
        }
      });
      
      saveCookies(cookieObj);
      console.log('Cookies saved. Please run the script again.');
      rl.close();
    });
    
    return;
  }
  
  // Create API client with cookies
  const apiClient = createApiClient(cookies);
  
  try {
    // Test getting user's leagues
    console.log('\n=== User Leagues ===');
    const leagues = await getUserLeagues(apiClient);
    if (leagues.length === 0) {
      console.log('No leagues found or authentication failed.');
      return;
    }
    
    leagues.forEach((league, index) => {
      console.log(`${index + 1}. ${league.name} (ID: ${league.id})`);
    });
    
    // Test getting league details
    console.log('\n=== League Details ===');
    const leagueDetails = await getLeagueDetails(apiClient, LEAGUE_ID);
    console.log(`Name: ${leagueDetails.name || 'N/A'}`);
    console.log(`Sport: ${leagueDetails.sport || 'N/A'}`);
    console.log(`Season: ${leagueDetails.season || 'N/A'}`);
    
    // Test getting league teams
    console.log('\n=== League Teams ===');
    const teams = await getLeagueTeams(apiClient, LEAGUE_ID);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team.id})`);
    });
    
    // Test getting league standings
    console.log('\n=== League Standings ===');
    const standings = await getLeagueStandings(apiClient, LEAGUE_ID);
    if (standings.teams) {
      standings.teams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name}: ${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`);
      });
    } else {
      console.log('No standings data available');
    }
    
    console.log('\nAPI test completed successfully!');
  } catch (error) {
    console.error(`Error testing Fantrax API: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the test
testFantraxApi();
