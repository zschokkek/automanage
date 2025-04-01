const axios = require('axios');
const logger = require('../utils/logger');

class FantraxService {
  constructor(accessToken) {
    this.apiClient = axios.create({
      baseURL: 'https://www.fantrax.com/fxpa/req',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
  }

  /**
   * Get all leagues for the authenticated user
   * @returns {Promise<Array>} List of user's leagues
   */
  async getUserLeagues() {
    try {
      const response = await this.apiClient.post('/leagues', {
        msgs: [{
          method: 'getLeaguesForCurrentUser',
          data: {
            'filter.sport': 'NFL'
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || [];
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
      const response = await this.apiClient.post('/league-settings', {
        msgs: [{
          method: 'getLeagueSettings',
          data: {
            leagueId: leagueId
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || {};
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
      const response = await this.apiClient.post('/roster', {
        msgs: [{
          method: 'getRosterForTeam',
          data: {
            leagueId: leagueId,
            teamId: teamId
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || {};
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
      const response = await this.apiClient.post('/schedule', {
        msgs: [{
          method: 'getScheduleForLeague',
          data: {
            leagueId: leagueId,
            scoringPeriod: period
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || [];
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
      const response = await this.apiClient.post('/scoring-stats', {
        msgs: [{
          method: 'getScoringStatsForLeague',
          data: {
            leagueId: leagueId,
            scoringPeriod: period
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || {};
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
      const response = await this.apiClient.post('/players', {
        msgs: [{
          method: 'getAvailablePlayers',
          data: {
            leagueId: leagueId,
            'filter.statusOrAvailability': 'AVAILABLE'
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || [];
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
      const response = await this.apiClient.post('/player-news', {
        msgs: [{
          method: 'getPlayerNews',
          data: {
            playerId: playerId
          }
        }]
      });
      
      if (response.data && response.data.responses && response.data.responses[0]) {
        return response.data.responses[0].data || [];
      }
      
      return [];
    } catch (error) {
      logger.error(`Error fetching Fantrax player news: ${error.message}`);
      throw new Error(`Failed to fetch Fantrax player news: ${error.message}`);
    }
  }
}

module.exports = FantraxService;
