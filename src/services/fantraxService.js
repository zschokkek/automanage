const axios = require('axios');
const logger = require('../utils/logger');

class FantraxService {
  /**
   * Create a new Fantrax service
   * @param {Object} options - Options for the service
   * @param {string} options.email - Fantrax email
   * @param {string} options.password - Fantrax password
   */
  constructor(options = {}) {
    this.email = options.email;
    this.password = options.password;
    this.isAuthenticated = false;
    
    this.apiClient = axios.create({
      baseURL: 'https://www.fantrax.com/api/v3',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      withCredentials: true
    });
    
    // Add response interceptor to handle authentication errors
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401 && !this.isAuthenticated) {
          // Try to authenticate and retry the request
          try {
            await this.authenticate();
            // Retry the original request
            return this.apiClient(error.config);
          } catch (authError) {
            logger.error(`Authentication failed: ${authError.message}`);
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Fantrax using email and password
   * @returns {Promise<boolean>} True if authentication was successful
   */
  async authenticate() {
    try {
      if (!this.email || !this.password) {
        throw new Error('Email and password are required for authentication');
      }
      
      const response = await axios.post('https://www.fantrax.com/api/v3/users/login', {
        email: this.email,
        password: this.password,
        rememberMe: true
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.status === 200) {
        // Get cookies from response
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          // Set cookies for future requests
          this.apiClient.defaults.headers.Cookie = cookies.join('; ');
        }
        
        this.isAuthenticated = true;
        logger.info('Successfully authenticated with Fantrax');
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Authentication failed: ${error.message}`);
      throw new Error(`Failed to authenticate with Fantrax: ${error.message}`);
    }
  }

  /**
   * Get all leagues for the authenticated user
   * @returns {Promise<Array>} List of user's leagues
   */
  async getUserLeagues() {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get('/leagues', {
        params: {
          sport: 'NFL',
          view: 'CURRENT_SEASON'
        }
      });
      
      if (response.data && response.data.leagues) {
        return response.data.leagues || [];
      }
      
      return [];
    } catch (error) {
      logger.error(`Error fetching Fantrax leagues: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax leagues: ${error.message}`);
    }
  }

  /**
   * Get league settings and information
   * @param {string} leagueId - Fantrax league ID
   * @returns {Promise<Object>} League settings
   */
  async getLeagueSettings(leagueId) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/leagues/${leagueId}/settings`);
      
      if (response.data) {
        return response.data || {};
      }
      
      return {};
    } catch (error) {
      logger.error(`Error fetching Fantrax league settings: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax league settings: ${error.message}`);
    }
  }

  /**
   * Get user's roster for a specific league
   * @param {string} leagueId - Fantrax league ID
   * @param {string} teamId - Fantrax team ID
   * @returns {Promise<Object>} User's roster
   */
  async getUserRoster(leagueId, teamId) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/leagues/${leagueId}/teams/${teamId}/roster`);
      
      if (response.data) {
        return response.data || {};
      }
      
      return {};
    } catch (error) {
      logger.error(`Error fetching Fantrax roster: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax roster: ${error.message}`);
    }
  }

  /**
   * Get weekly matchups for a league
   * @param {string} leagueId - Fantrax league ID
   * @param {number} period - Period/Week number
   * @returns {Promise<Array>} Weekly matchups
   */
  async getWeeklyMatchups(leagueId, period) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/leagues/${leagueId}/schedule`, {
        params: {
          scoringPeriod: period
        }
      });
      
      if (response.data && response.data.matchups) {
        return response.data.matchups || [];
      }
      
      return [];
    } catch (error) {
      logger.error(`Error fetching Fantrax matchups: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax matchups: ${error.message}`);
    }
  }

  /**
   * Get player box scores for a specific week
   * @param {string} leagueId - Fantrax league ID
   * @param {number} period - Period/Week number
   * @returns {Promise<Object>} Player box scores
   */
  async getPlayerBoxScores(leagueId, period) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/leagues/${leagueId}/scoring-stats`, {
        params: {
          scoringPeriod: period
        }
      });
      
      if (response.data && response.data.playerStats) {
        return response.data.playerStats || {};
      }
      
      return {};
    } catch (error) {
      logger.error(`Error fetching Fantrax box scores: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax box scores: ${error.message}`);
    }
  }

  /**
   * Get available players (waiver wire)
   * @param {string} leagueId - Fantrax league ID
   * @returns {Promise<Array>} Available players
   */
  async getAvailablePlayers(leagueId) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/leagues/${leagueId}/players`, {
        params: {
          statusOrAvailability: 'AVAILABLE'
        }
      });
      
      if (response.data && response.data.players) {
        return response.data.players || [];
      }
      
      return [];
    } catch (error) {
      logger.error(`Error fetching Fantrax available players: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax available players: ${error.message}`);
    }
  }

  /**
   * Get player news
   * @param {string} playerId - Fantrax player ID
   * @returns {Promise<Array>} Player news
   */
  async getPlayerNews(playerId) {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get(`/players/${playerId}/news`);
      
      if (response.data && response.data.news) {
        return response.data.news || [];
      }
      
      return [];
    } catch (error) {
      logger.error(`Error fetching Fantrax player news: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax player news: ${error.message}`);
    }
  }
  
  /**
   * Test the API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      // Ensure we're authenticated
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      const response = await this.apiClient.get('/user');
      return response.status === 200;
    } catch (error) {
      logger.error(`Error testing Fantrax connection: ${error.message}`);
      return false;
    }
  }

  /**
   * Get public league data without requiring authentication
   * @param {string} leagueId - Fantrax league ID
   * @returns {Promise<Object>} Public league data
   */
  async getPublicLeagueData(leagueId) {
    try {
      // Create a new axios instance without authentication
      const publicClient = axios.create({
        baseURL: 'https://www.fantrax.com/api/v3',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Get basic league info
      const leagueResponse = await publicClient.get(`/leagues/${leagueId}`);
      
      if (!leagueResponse.data || leagueResponse.status !== 200) {
        throw new Error('League not found or not public');
      }
      
      // Get league standings
      const standingsResponse = await publicClient.get(`/leagues/${leagueId}/standings`);
      
      // Get league teams
      const teamsResponse = await publicClient.get(`/leagues/${leagueId}/teams`);
      
      return {
        leagueInfo: leagueResponse.data,
        standings: standingsResponse.data?.standings || [],
        teams: teamsResponse.data?.teams || []
      };
    } catch (error) {
      logger.error(`Error fetching public league data: ${error.message}`);
      throw new Error(`Failed to fetch public league data: ${error.message}`);
    }
  }
}

module.exports = FantraxService;
