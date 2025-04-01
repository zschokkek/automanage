const express = require('express');
const League = require('../models/League');
const Roster = require('../models/Roster');
const ESPNService = require('../services/espnService');
const SleeperService = require('../services/sleeperService');
const FantraxService = require('../services/fantraxService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all leagues for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const leagues = await League.find({
      'teams.owner': req.user._id
    });
    
    res.json({ leagues });
  } catch (error) {
    logger.error(`Error fetching leagues: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Sync leagues from all connected platforms
router.post('/sync', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const syncResults = {
      added: 0,
      updated: 0,
      errors: []
    };
    
    // Process each connected platform
    for (const platform of user.platforms) {
      try {
        let leagues = [];
        const currentYear = new Date().getFullYear();
        
        // Fetch leagues from the appropriate platform
        switch (platform.platform) {
          case 'espn':
            const espnService = new ESPNService(platform.accessToken);
            leagues = await espnService.getUserLeagues(currentYear);
            break;
          case 'sleeper':
            const sleeperService = new SleeperService(platform.userId);
            leagues = await sleeperService.getUserLeagues(currentYear);
            break;
          case 'fantrax':
            const fantraxService = new FantraxService(platform.accessToken);
            leagues = await fantraxService.getUserLeagues();
            break;
          default:
            continue;
        }
        
        // Process each league
        for (const leagueData of leagues) {
          try {
            // Extract league ID based on platform
            let platformLeagueId;
            let leagueName;
            let scoringFormat;
            let rosterSettings;
            
            switch (platform.platform) {
              case 'espn':
                platformLeagueId = leagueData.id;
                leagueName = leagueData.name;
                scoringFormat = leagueData.scoringSettings?.scoringType || 'standard';
                rosterSettings = mapESPNRosterSettings(leagueData.settings?.rosterSettings);
                break;
              case 'sleeper':
                platformLeagueId = leagueData.league_id;
                leagueName = leagueData.name;
                scoringFormat = determineScoringFormat(leagueData.scoring_settings);
                rosterSettings = mapSleeperRosterSettings(leagueData.roster_positions);
                break;
              case 'fantrax':
                platformLeagueId = leagueData.leagueId;
                leagueName = leagueData.leagueName;
                scoringFormat = 'custom'; // Fantrax often has custom scoring
                rosterSettings = mapFantraxRosterSettings(leagueData.rosterRequirements);
                break;
              default:
                continue;
            }
            
            // Find or create league
            let league = await League.findOne({
              platform: platform.platform,
              platformLeagueId
            });
            
            if (!league) {
              // Create new league
              league = new League({
                name: leagueName,
                platform: platform.platform,
                platformLeagueId,
                season: currentYear,
                scoringFormat,
                rosterSettings,
                teams: []
              });
              
              syncResults.added++;
            } else {
              // Update existing league
              league.name = leagueName;
              league.scoringFormat = scoringFormat;
              league.rosterSettings = rosterSettings;
              league.lastUpdated = new Date();
              
              syncResults.updated++;
            }
            
            // Add or update user's team in the league
            const userTeamIndex = league.teams.findIndex(team => 
              team.owner && team.owner.toString() === user._id.toString()
            );
            
            if (userTeamIndex === -1) {
              // Add user's team
              league.teams.push({
                platformTeamId: getUserTeamId(platform.platform, leagueData, platform.userId),
                name: getUserTeamName(platform.platform, leagueData, platform.userId),
                owner: user._id,
                record: {
                  wins: 0,
                  losses: 0,
                  ties: 0
                }
              });
            }
            
            await league.save();
          } catch (error) {
            logger.error(`Error processing league: ${error.message}`);
            syncResults.errors.push(`Error processing league: ${error.message}`);
          }
        }
      } catch (error) {
        logger.error(`Error syncing ${platform.platform} leagues: ${error.message}`);
        syncResults.errors.push(`Error syncing ${platform.platform} leagues: ${error.message}`);
      }
    }
    
    res.json({ success: true, syncResults });
  } catch (error) {
    logger.error(`Error syncing leagues: ${error.message}`);
    res.status(500).json({ error: 'Failed to sync leagues' });
  }
});

// Get a specific league by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    // Check if user has access to this league
    const userTeam = league.teams.find(team => 
      team.owner && team.owner.toString() === req.user._id.toString()
    );
    
    if (!userTeam) {
      return res.status(403).json({ error: 'You do not have access to this league' });
    }
    
    res.json({ league });
  } catch (error) {
    logger.error(`Error fetching league: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// Get user's roster for a specific league and week
router.get('/:id/roster/:week', isAuthenticated, async (req, res) => {
  try {
    const { id, week } = req.params;
    const currentYear = new Date().getFullYear();
    
    // Find the league
    const league = await League.findById(id);
    
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    // Check if user has access to this league
    const userTeam = league.teams.find(team => 
      team.owner && team.owner.toString() === req.user._id.toString()
    );
    
    if (!userTeam) {
      return res.status(403).json({ error: 'You do not have access to this league' });
    }
    
    // Find or fetch roster
    let roster = await Roster.findOne({
      league: league._id,
      'team.platformTeamId': userTeam.platformTeamId,
      week: parseInt(week),
      season: currentYear
    }).populate('players.player');
    
    if (!roster) {
      // Fetch roster from the appropriate platform
      const platform = req.user.platforms.find(p => p.platform === league.platform);
      
      if (!platform) {
        return res.status(400).json({ error: 'Platform not connected' });
      }
      
      // Fetch roster data from platform
      let rosterData;
      
      switch (league.platform) {
        case 'espn':
          const espnService = new ESPNService(platform.accessToken);
          rosterData = await espnService.getUserRoster(league.platformLeagueId, userTeam.platformTeamId, currentYear);
          break;
        case 'sleeper':
          const sleeperService = new SleeperService(platform.userId);
          const leagueRosters = await sleeperService.getLeagueRosters(league.platformLeagueId);
          rosterData = leagueRosters.find(r => r.owner_id === platform.userId);
          break;
        case 'fantrax':
          const fantraxService = new FantraxService(platform.accessToken);
          rosterData = await fantraxService.getUserRoster(league.platformLeagueId, userTeam.platformTeamId);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported platform' });
      }
      
      // Process roster data and create roster
      // This would be a complex process to map platform-specific data to our model
      // For now, we'll return a placeholder
      
      return res.status(404).json({ 
        error: 'Roster not found',
        message: 'Roster data needs to be synced first'
      });
    }
    
    res.json({ roster });
  } catch (error) {
    logger.error(`Error fetching roster: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Helper functions for mapping platform-specific data

// Map ESPN roster settings to our model
function mapESPNRosterSettings(settings) {
  if (!settings) return {};
  
  return {
    qb: settings.qb || 1,
    rb: settings.rb || 2,
    wr: settings.wr || 2,
    te: settings.te || 1,
    flex: settings.flex || 1,
    superflex: settings.superflex || 0,
    k: settings.k || 1,
    dst: settings.dst || 1,
    bench: settings.bench || 6,
    ir: settings.ir || 1
  };
}

// Map Sleeper roster settings to our model
function mapSleeperRosterSettings(positions) {
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

// Map Fantrax roster settings to our model
function mapFantraxRosterSettings(requirements) {
  if (!requirements) return {};
  
  return {
    qb: requirements.QB || 1,
    rb: requirements.RB || 2,
    wr: requirements.WR || 2,
    te: requirements.TE || 1,
    flex: (requirements.FLEX || 0),
    superflex: (requirements.SUPERFLEX || 0),
    k: requirements.K || 1,
    dst: requirements.DST || 1,
    bench: requirements.Bench || 6,
    ir: requirements.IR || 1
  };
}

// Determine scoring format based on scoring settings
function determineScoringFormat(scoringSettings) {
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

// Get user's team ID from league data
function getUserTeamId(platform, leagueData, userId) {
  switch (platform) {
    case 'espn':
      const espnTeam = leagueData.teams.find(team => team.owners.includes(userId));
      return espnTeam ? espnTeam.id : 'unknown';
    case 'sleeper':
      const sleeperTeam = leagueData.rosters.find(roster => roster.owner_id === userId);
      return sleeperTeam ? sleeperTeam.roster_id : 'unknown';
    case 'fantrax':
      const fantraxTeam = leagueData.teams.find(team => team.userId === userId);
      return fantraxTeam ? fantraxTeam.id : 'unknown';
    default:
      return 'unknown';
  }
}

// Get user's team name from league data
function getUserTeamName(platform, leagueData, userId) {
  switch (platform) {
    case 'espn':
      const espnTeam = leagueData.teams.find(team => team.owners.includes(userId));
      return espnTeam ? espnTeam.name : 'My Team';
    case 'sleeper':
      const sleeperTeam = leagueData.rosters.find(roster => roster.owner_id === userId);
      const sleeperUser = leagueData.users.find(user => user.user_id === userId);
      return sleeperUser ? sleeperUser.team_name || sleeperUser.display_name : 'My Team';
    case 'fantrax':
      const fantraxTeam = leagueData.teams.find(team => team.userId === userId);
      return fantraxTeam ? fantraxTeam.name : 'My Team';
    default:
      return 'My Team';
  }
}

module.exports = router;
