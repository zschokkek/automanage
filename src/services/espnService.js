const axios = require('axios');
const logger = require('../utils/logger');

class ESPNService {
  constructor(accessToken) {
    this.apiClient = axios.create({
      baseURL: 'https://fantasy.espn.com/apis/v3/games/ffl',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get all leagues for the authenticated user
   * @returns {Promise<Array>} List of user's leagues
   */
  async getUserLeagues(season) {
    try {
      const response = await this.apiClient.get('/games', {
        params: {
          seasonId: season || new Date().getFullYear()
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ESPN leagues: ${error.message}`);
      throw new Error(`Failed to fetch ESPN leagues: ${error.message}`);
    }
  }

  /**
   * Get league settings and information
   * @param {string} leagueId - ESPN league ID
   * @param {number} season - Season year
   * @returns {Promise<Object>} League settings
   */
  async getLeagueSettings(leagueId, season) {
    try {
      const response = await this.apiClient.get(`/seasons/${season}/segments/0/leagues/${leagueId}`, {
        params: {
          view: 'mSettings'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ESPN league settings: ${error.message}`);
      throw new Error(`Failed to fetch ESPN league settings: ${error.message}`);
    }
  }

  /**
   * Get user's roster for a specific league
   * @param {string} leagueId - ESPN league ID
   * @param {string} teamId - ESPN team ID
   * @param {number} season - Season year
   * @returns {Promise<Object>} User's roster
   */
  async getUserRoster(leagueId, teamId, season) {
    try {
      const response = await this.apiClient.get(`/seasons/${season}/segments/0/leagues/${leagueId}/teams/${teamId}`, {
        params: {
          view: 'mRoster'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ESPN roster: ${error.message}`);
      throw new Error(`Failed to fetch ESPN roster: ${error.message}`);
    }
  }

  /**
   * Get weekly matchups for a league
   * @param {string} leagueId - ESPN league ID
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Array>} Weekly matchups
   */
  async getWeeklyMatchups(leagueId, season, week) {
    try {
      const response = await this.apiClient.get(`/seasons/${season}/segments/0/leagues/${leagueId}`, {
        params: {
          view: 'mMatchup',
          scoringPeriodId: week
        }
      });
      
      return response.data.schedule.filter(matchup => matchup.matchupPeriodId === week);
    } catch (error) {
      logger.error(`Error fetching ESPN matchups: ${error.message}`);
      throw new Error(`Failed to fetch ESPN matchups: ${error.message}`);
    }
  }

  /**
   * Get player box scores for a specific week
   * @param {string} leagueId - ESPN league ID
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Object>} Player box scores
   */
  async getPlayerBoxScores(leagueId, season, week) {
    try {
      const response = await this.apiClient.get(`/seasons/${season}/segments/0/leagues/${leagueId}`, {
        params: {
          view: 'mBoxscore',
          scoringPeriodId: week
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ESPN box scores: ${error.message}`);
      throw new Error(`Failed to fetch ESPN box scores: ${error.message}`);
    }
  }

  /**
   * Get available players (waiver wire)
   * @param {string} leagueId - ESPN league ID
   * @param {number} season - Season year
   * @returns {Promise<Array>} Available players
   */
  async getAvailablePlayers(leagueId, season) {
    try {
      // ESPN API limits the number of players returned in a single request
      // We'll need to make multiple requests with different offsets
      const playersPerRequest = 50;
      let allPlayers = [];
      let offset = 0;
      let hasMorePlayers = true;
      
      while (hasMorePlayers) {
        const response = await this.apiClient.get(`/seasons/${season}/segments/0/leagues/${leagueId}/players`, {
          params: {
            view: 'kona_player_info',
            scoringPeriodId: 0,
            status: 'FREEAGENT',
            limit: playersPerRequest,
            offset: offset
          }
        });
        
        const players = response.data.players || [];
        allPlayers = [...allPlayers, ...players];
        
        if (players.length < playersPerRequest) {
          hasMorePlayers = false;
        } else {
          offset += playersPerRequest;
        }
      }
      
      return allPlayers;
    } catch (error) {
      logger.error(`Error fetching ESPN available players: ${error.message}`);
      throw new Error(`Failed to fetch ESPN available players: ${error.message}`);
    }
  }
}

module.exports = ESPNService;
