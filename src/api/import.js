const express = require('express');
const leagueImportService = require('../services/leagueImportService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to ensure user is authenticated or create a guest user
const ensureUser = async (req, res, next) => {
  // If user is already authenticated, continue
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For direct imports without authentication, create a guest user or session
  try {
    // Use email or username as identifier
    const identifier = req.body.email || req.body.username || `guest_${Date.now()}`;
    const platform = req.body.platform;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }
    
    // Create or get a user
    const user = await leagueImportService.getOrCreateUser(platform, identifier);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    logger.error(`Error ensuring user: ${error.message}`);
    res.status(500).json({ error: 'Failed to process user information' });
  }
};

// Import an ESPN league
router.post('/espn', ensureUser, async (req, res) => {
  try {
    const { leagueId, season, teamId } = req.body;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }
    
    const currentYear = new Date().getFullYear();
    const leagueSeason = season || currentYear;
    
    // Import the league
    const league = await leagueImportService.importESPNLeague(
      leagueId,
      leagueSeason,
      teamId,
      req.user
    );
    
    res.json({
      success: true,
      message: 'ESPN league imported successfully',
      league
    });
  } catch (error) {
    logger.error(`Error importing ESPN league: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Import a Sleeper league
router.post('/sleeper', ensureUser, async (req, res) => {
  try {
    const { leagueId, username } = req.body;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Import the league
    const league = await leagueImportService.importSleeperLeague(
      leagueId,
      username,
      req.user
    );
    
    res.json({
      success: true,
      message: 'Sleeper league imported successfully',
      league
    });
  } catch (error) {
    logger.error(`Error importing Sleeper league: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Import a Fantrax league
router.post('/fantrax', ensureUser, async (req, res) => {
  try {
    const { leagueId, email } = req.body;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Import the league
    const league = await leagueImportService.importFantraxLeague(
      leagueId,
      email,
      req.user
    );
    
    res.json({
      success: true,
      message: 'Fantrax league imported successfully',
      league,
      warning: league.warning
    });
  } catch (error) {
    logger.error(`Error importing Fantrax league: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get import status
router.get('/status/:id', async (req, res) => {
  try {
    // In a real implementation, we would check the status of an import job
    // For now, we'll return a placeholder
    res.json({
      status: 'completed',
      message: 'Import completed successfully'
    });
  } catch (error) {
    logger.error(`Error checking import status: ${error.message}`);
    res.status(500).json({ error: 'Failed to check import status' });
  }
});

module.exports = router;
