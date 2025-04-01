const axios = require('axios');
const logger = require('../utils/logger');
const League = require('../models/League');
const User = require('../models/User');

class LeagueImportService {
  /**
   * Import an ESPN league using league ID
   * @param {string} leagueId - ESPN league ID
   * @param {number} season - Season year
   * @param {number} teamId - Optional team ID to focus on
   * @param {Object} user - User object
   * @returns {Promise<Object>} Imported league data
   */
  async importESPNLeague(leagueId, season, teamId, user) {
    try {
      logger.info(`Importing ESPN league ${leagueId} for season ${season}`);
      
      // First, determine the sport type by checking the game type
      let sport = 'football';
      let gameEndpoint = 'ffl'; // Default to football
      
      try {
        // Try to detect the sport by checking if it's a baseball league
        const sportCheckResponse = await axios.get(`https://fantasy.espn.com/apis/v3/games/flb/seasons/${season}/segments/0/leagues/${leagueId}`, {
          params: { view: 'mSettings' }
        });
        
        if (sportCheckResponse.data) {
          sport = 'baseball';
          gameEndpoint = 'flb';
          logger.info(`Detected baseball league for ESPN league ${leagueId}`);
        }
      } catch (error) {
        // If error, it's likely not a baseball league, try basketball
        try {
          const basketballCheckResponse = await axios.get(`https://fantasy.espn.com/apis/v3/games/fba/seasons/${season}/segments/0/leagues/${leagueId}`, {
            params: { view: 'mSettings' }
          });
          
          if (basketballCheckResponse.data) {
            sport = 'basketball';
            gameEndpoint = 'fba';
            logger.info(`Detected basketball league for ESPN league ${leagueId}`);
          }
        } catch (basketballError) {
          // If error, it's likely not a basketball league, try hockey
          try {
            const hockeyCheckResponse = await axios.get(`https://fantasy.espn.com/apis/v3/games/fhl/seasons/${season}/segments/0/leagues/${leagueId}`, {
              params: { view: 'mSettings' }
            });
            
            if (hockeyCheckResponse.data) {
              sport = 'hockey';
              gameEndpoint = 'fhl';
              logger.info(`Detected hockey league for ESPN league ${leagueId}`);
            }
          } catch (hockeyError) {
            // Default to football if all checks fail
            logger.info(`Defaulting to football for ESPN league ${leagueId}`);
          }
        }
      }
      
      // ESPN's public API endpoint for league data with the detected sport
      const response = await axios.get(`https://fantasy.espn.com/apis/v3/games/${gameEndpoint}/seasons/${season}/segments/0/leagues/${leagueId}`, {
        params: {
          view: 'mSettings,mTeam,mRoster'
        }
      });
      
      if (!response.data) {
        throw new Error('League not found or is private');
      }
      
      // Extract league settings
      const leagueData = response.data;
      const leagueName = leagueData.settings.name;
      const scoringFormat = this.determineESPNScoringFormat(leagueData.settings.scoringSettings);
      const rosterSettings = this.mapESPNRosterSettings(leagueData.settings.rosterSettings, sport);
      
      // Find or create league in database
      let league = await League.findOne({
        platform: 'espn',
        platformLeagueId: leagueId,
        season
      });
      
      if (!league) {
        // Create new league
        league = new League({
          name: leagueName,
          platform: 'espn',
          platformLeagueId: leagueId,
          sport, // Add the detected sport
          season,
          scoringFormat,
          rosterSettings,
          teams: []
        });
      } else {
        // Update existing league
        league.name = leagueName;
        league.sport = sport; // Update the sport
        league.scoringFormat = scoringFormat;
        league.rosterSettings = rosterSettings;
        league.lastUpdated = new Date();
      }
      
      // Process teams
      if (leagueData.teams) {
        // If a specific team ID is provided, only process that team
        const teamsToProcess = teamId ? 
          leagueData.teams.filter(team => team.id === parseInt(teamId)) : 
          leagueData.teams;
        
        for (const team of teamsToProcess) {
          const teamIndex = league.teams.findIndex(t => t.platformTeamId === team.id.toString());
          
          if (teamIndex === -1) {
            // Add new team
            league.teams.push({
              platformTeamId: team.id.toString(),
              name: team.name || `Team ${team.id}`,
              owner: user._id,
              record: {
                wins: team.record?.overall?.wins || 0,
                losses: team.record?.overall?.losses || 0,
                ties: team.record?.overall?.ties || 0
              }
            });
          } else {
            // Update existing team
            league.teams[teamIndex].name = team.name || `Team ${team.id}`;
            league.teams[teamIndex].owner = user._id;
            league.teams[teamIndex].record = {
              wins: team.record?.overall?.wins || 0,
              losses: team.record?.overall?.losses || 0,
              ties: team.record?.overall?.ties || 0
            };
          }
        }
      }
      
      await league.save();
      return league;
    } catch (error) {
      logger.error(`Error importing ESPN league: ${error.message}`);
      throw new Error(`Failed to import ESPN league: ${error.message}`);
    }
  }
  
  /**
   * Import a Sleeper league using league ID
   * @param {string} leagueId - Sleeper league ID
   * @param {string} username - Sleeper username
   * @param {Object} user - User object
   * @returns {Promise<Object>} Imported league data
   */
  async importSleeperLeague(leagueId, username, user) {
    try {
      logger.info(`Importing Sleeper league ${leagueId} for user ${username}`);
      
      // Get league info
      const leagueResponse = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}`);
      
      if (!leagueResponse.data) {
        throw new Error('League not found');
      }
      
      const leagueData = leagueResponse.data;
      const season = leagueData.season;
      
      // Get league users
      const usersResponse = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      const leagueUsers = usersResponse.data || [];
      
      // Find the user in the league
      const sleeperUser = leagueUsers.find(u => u.display_name.toLowerCase() === username.toLowerCase());
      
      if (!sleeperUser) {
        throw new Error(`User ${username} not found in this league`);
      }
      
      // Get league rosters
      const rostersResponse = await axios.get(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      const leagueRosters = rostersResponse.data || [];
      
      // Find the user's roster
      const userRoster = leagueRosters.find(r => r.owner_id === sleeperUser.user_id);
      
      if (!userRoster) {
        throw new Error(`Roster for user ${username} not found in this league`);
      }
      
      // Determine scoring format and roster settings
      const scoringFormat = this.determineSleeperScoringFormat(leagueData.scoring_settings);
      const rosterSettings = this.mapSleeperRosterSettings(leagueData.roster_positions);
      
      // Find or create league in database
      let league = await League.findOne({
        platform: 'sleeper',
        platformLeagueId: leagueId
      });
      
      if (!league) {
        // Create new league
        league = new League({
          name: leagueData.name,
          platform: 'sleeper',
          platformLeagueId: leagueId,
          season,
          scoringFormat,
          rosterSettings,
          teams: []
        });
      } else {
        // Update existing league
        league.name = leagueData.name;
        league.season = season;
        league.scoringFormat = scoringFormat;
        league.rosterSettings = rosterSettings;
        league.lastUpdated = new Date();
      }
      
      // Add or update user's team
      const teamIndex = league.teams.findIndex(t => t.platformTeamId === userRoster.roster_id.toString());
      
      if (teamIndex === -1) {
        // Add new team
        league.teams.push({
          platformTeamId: userRoster.roster_id.toString(),
          name: sleeperUser.metadata?.team_name || sleeperUser.display_name,
          owner: user._id,
          record: {
            wins: userRoster.settings?.wins || 0,
            losses: userRoster.settings?.losses || 0,
            ties: userRoster.settings?.ties || 0
          }
        });
      } else {
        // Update existing team
        league.teams[teamIndex].name = sleeperUser.metadata?.team_name || sleeperUser.display_name;
        league.teams[teamIndex].owner = user._id;
        league.teams[teamIndex].record = {
          wins: userRoster.settings?.wins || 0,
          losses: userRoster.settings?.losses || 0,
          ties: userRoster.settings?.ties || 0
        };
      }
      
      await league.save();
      return league;
    } catch (error) {
      logger.error(`Error importing Sleeper league: ${error.message}`);
      throw new Error(`Failed to import Sleeper league: ${error.message}`);
    }
  }
  
  /**
   * Import a Fantrax league using league ID
   * @param {string} leagueId - Fantrax league ID
   * @param {string} email - User's email for identification
   * @param {Object} user - User object
   * @returns {Promise<Object>} Imported league data
   */
  async importFantraxLeague(leagueId, email, user) {
    try {
      logger.info(`Attempting to import Fantrax league ${leagueId}`);
      
      // Note: Fantrax doesn't have a public API, so we'll create a placeholder implementation
      // In a real implementation, we would need to use web scraping or a different approach
      
      // Create a placeholder league
      const league = new League({
        name: `Fantrax League ${leagueId}`,
        platform: 'fantrax',
        platformLeagueId: leagueId,
        season: new Date().getFullYear(),
        scoringFormat: 'custom', // Fantrax often has custom scoring
        rosterSettings: {
          qb: 1,
          rb: 2,
          wr: 2,
          te: 1,
          flex: 1,
          superflex: 0,
          k: 1,
          dst: 1,
          bench: 6,
          ir: 1
        },
        teams: [{
          platformTeamId: '1', // Placeholder
          name: `${user.username || email}'s Team`,
          owner: user._id,
          record: {
            wins: 0,
            losses: 0,
            ties: 0
          }
        }]
      });
      
      await league.save();
      
      // Note to user about Fantrax limitations
      logger.info('Fantrax import is limited due to lack of public API');
      
      return {
        ...league.toObject(),
        warning: 'Fantrax import is limited. Only basic league information is available.'
      };
    } catch (error) {
      logger.error(`Error importing Fantrax league: ${error.message}`);
      throw new Error(`Failed to import Fantrax league: ${error.message}`);
    }
  }
  
  /**
   * Create or get a user for league import
   * @param {string} platform - Platform name
   * @param {string} identifier - User identifier (email, username)
   * @returns {Promise<Object>} User object
   */
  async getOrCreateUser(platform, identifier) {
    try {
      // Try to find an existing user with this platform and identifier
      let user = await User.findOne({
        $or: [
          { email: identifier },
          { username: identifier },
          { 'platforms.platform': platform, 'platforms.username': identifier }
        ]
      });
      
      if (!user) {
        // Create a new user
        user = new User({
          username: `${platform}_${identifier}`,
          email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
          platforms: [{
            platform,
            userId: identifier,
            username: identifier
          }]
        });
      } else {
        // Check if this platform is already connected
        const platformExists = user.platforms.some(p => p.platform === platform);
        
        if (!platformExists) {
          // Add the platform to the user
          user.platforms.push({
            platform,
            userId: identifier,
            username: identifier
          });
        }
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      return user;
    } catch (error) {
      logger.error(`Error creating/getting user: ${error.message}`);
      throw new Error(`Failed to create/get user: ${error.message}`);
    }
  }
  
  /**
   * Determine ESPN scoring format
   * @param {Object} scoringSettings - ESPN scoring settings
   * @returns {string} Scoring format
   */
  determineESPNScoringFormat(scoringSettings) {
    if (!scoringSettings) {
      return 'standard';
    }
    
    // For football, check PPR settings
    if (scoringSettings.recPPR === 1) {
      return 'ppr';
    } else if (scoringSettings.recPPR === 0.5) {
      return 'half_ppr';
    } else if (scoringSettings.recPPR === 0) {
      return 'standard';
    }
    
    // Default to custom for other sports or unusual settings
    return 'custom';
  }
  
  /**
   * Map ESPN roster settings to our model
   * @param {Object} settings - ESPN roster settings
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {Object} Mapped roster settings
   */
  mapESPNRosterSettings(settings, sport = 'football') {
    if (!settings) {
      return {};
    }
    
    if (sport === 'football') {
      return {
        qb: settings.QUARTERBACK || 0,
        rb: settings.RUNNING_BACK || 0,
        wr: settings.WIDE_RECEIVER || 0,
        te: settings.TIGHT_END || 0,
        flex: settings.FLEX || 0,
        superflex: settings.SUPER_FLEX || 0,
        k: settings.KICKER || 0,
        dst: settings.TEAM_DEFENSE || 0,
        bench: settings.BENCH || 0,
        ir: settings.INJURED_RESERVE || 0
      };
    } else if (sport === 'baseball') {
      return {
        c: settings.CATCHER || 0,
        '1b': settings.FIRST_BASE || 0,
        '2b': settings.SECOND_BASE || 0,
        '3b': settings.THIRD_BASE || 0,
        ss: settings.SHORTSTOP || 0,
        of: (settings.OUTFIELD || 0) + (settings.CENTER_FIELD || 0) + (settings.LEFT_FIELD || 0) + (settings.RIGHT_FIELD || 0),
        util: settings.UTILITY || 0,
        sp: settings.STARTING_PITCHER || 0,
        rp: settings.RELIEF_PITCHER || 0,
        p: settings.PITCHER || 0,
        bench: settings.BENCH || 0,
        ir: settings.INJURED_RESERVE || 0
      };
    } else {
      // For other sports, just return a generic mapping
      return {
        bench: settings.BENCH || 0,
        ir: settings.INJURED_RESERVE || 0
      };
    }
  }
  
  /**
   * Determine Sleeper scoring format
   * @param {Object} scoringSettings - Sleeper scoring settings
   * @returns {string} Scoring format
   */
  determineSleeperScoringFormat(scoringSettings) {
    if (!scoringSettings) return 'standard';
    
    // Check for PPR or half-PPR
    if (scoringSettings.rec) {
      if (scoringSettings.rec === 1) {
        return 'ppr';
      } else if (scoringSettings.rec === 0.5) {
        return 'half_ppr';
      }
    }
    
    return 'standard';
  }
  
  /**
   * Map Sleeper roster settings to our model
   * @param {Array} positions - Sleeper roster positions
   * @returns {Object} Mapped roster settings
   */
  mapSleeperRosterSettings(positions) {
    if (!positions) return {};
    
    const settings = {
      qb: 0,
      rb: 0,
      wr: 0,
      te: 0,
      flex: 0,
      superflex: 0,
      k: 0,
      dst: 0,
      bench: 0,
      ir: 0
    };
    
    // Count each position
    positions.forEach(pos => {
      switch (pos) {
        case 'QB':
          settings.qb++;
          break;
        case 'RB':
          settings.rb++;
          break;
        case 'WR':
          settings.wr++;
          break;
        case 'TE':
          settings.te++;
          break;
        case 'FLEX':
          settings.flex++;
          break;
        case 'SUPER_FLEX':
          settings.superflex++;
          break;
        case 'K':
          settings.k++;
          break;
        case 'DEF':
          settings.dst++;
          break;
        case 'BN':
          settings.bench++;
          break;
        case 'IR':
          settings.ir++;
          break;
      }
    });
    
    return settings;
  }
}

module.exports = new LeagueImportService();
