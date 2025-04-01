const axios = require('axios');
const logger = require('../utils/logger');

class SleeperService {
  constructor(userId) {
    this.apiClient = axios.create({
      baseURL: 'https://api.sleeper.app/v1',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    this.userId = userId;
  }

  /**
   * Get user information by username
   * @param {string} username - Sleeper username
   * @returns {Promise<Object>} User information
   */
  async getUserByUsername(username) {
    try {
      const response = await this.apiClient.get(`/user/${username}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper user: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper user: ${error.message}`);
    }
  }

  /**
   * Get all leagues for the authenticated user
   * @param {number} season - Season year
   * @returns {Promise<Array>} List of user's leagues
   */
  async getUserLeagues(season) {
    try {
      const response = await this.apiClient.get(`/user/${this.userId}/leagues/nfl/${season || new Date().getFullYear()}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper leagues: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper leagues: ${error.message}`);
    }
  }

  /**
   * Get league information
   * @param {string} leagueId - Sleeper league ID
   * @returns {Promise<Object>} League information
   */
  async getLeagueInfo(leagueId) {
    try {
      const response = await this.apiClient.get(`/league/${leagueId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper league info: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper league info: ${error.message}`);
    }
  }

  /**
   * Get league rosters
   * @param {string} leagueId - Sleeper league ID
   * @returns {Promise<Array>} League rosters
   */
  async getLeagueRosters(leagueId) {
    try {
      const response = await this.apiClient.get(`/league/${leagueId}/rosters`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper league rosters: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper league rosters: ${error.message}`);
    }
  }

  /**
   * Get league users
   * @param {string} leagueId - Sleeper league ID
   * @returns {Promise<Array>} League users
   */
  async getLeagueUsers(leagueId) {
    try {
      const response = await this.apiClient.get(`/league/${leagueId}/users`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper league users: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper league users: ${error.message}`);
    }
  }

  /**
   * Get matchups for a specific week
   * @param {string} leagueId - Sleeper league ID
   * @param {number} week - Week number
   * @returns {Promise<Array>} Weekly matchups
   */
  async getWeeklyMatchups(leagueId, week) {
    try {
      const response = await this.apiClient.get(`/league/${leagueId}/matchups/${week}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper matchups: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper matchups: ${error.message}`);
    }
  }

  /**
   * Get player information
   * @returns {Promise<Object>} Player information
   */
  async getAllPlayers() {
    try {
      const response = await this.apiClient.get('/players/nfl');
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper players: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper players: ${error.message}`);
    }
  }

  /**
   * Get player stats for a specific week
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Object>} Player stats
   */
  async getPlayerStats(season, week) {
    try {
      const response = await this.apiClient.get(`/stats/nfl/regular/${season}/${week}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper player stats: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper player stats: ${error.message}`);
    }
  }

  /**
   * Get player projections for a specific week
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Object>} Player projections
   */
  async getPlayerProjections(season, week) {
    try {
      const response = await this.apiClient.get(`/projections/nfl/regular/${season}/${week}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper player projections: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper player projections: ${error.message}`);
    }
  }

  /**
   * Get trending players (adds/drops)
   * @param {string} type - Type of trend (add or drop)
   * @param {number} lookbackHours - Hours to look back
   * @param {number} limit - Number of players to return
   * @returns {Promise<Array>} Trending players
   */
  async getTrendingPlayers(type = 'add', lookbackHours = 24, limit = 25) {
    try {
      const response = await this.apiClient.get(`/players/nfl/trending/${type}`, {
        params: {
          lookback_hours: lookbackHours,
          limit: limit
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sleeper trending players: ${error.message}`);
      throw new Error(`Failed to fetch Sleeper trending players: ${error.message}`);
    }
  }
}

module.exports = SleeperService;
