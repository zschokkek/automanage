const express = require('express');
const Analysis = require('../models/Analysis');
const League = require('../models/League');
const Roster = require('../models/Roster');
const analysisService = require('../services/analysisService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all analyses for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const analyses = await Analysis.find({
      user: req.user._id
    })
    .populate('league')
    .sort({ week: -1, generatedAt: -1 });
    
    res.json({ analyses });
  } catch (error) {
    logger.error(`Error fetching analyses: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get analyses for a specific league
router.get('/league/:leagueId', isAuthenticated, async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    // Find the league
    const league = await League.findById(leagueId);
    
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
    
    // Get analyses for this league
    const analyses = await Analysis.find({
      user: req.user._id,
      league: leagueId
    }).sort({ week: -1, generatedAt: -1 });
    
    res.json({ analyses });
  } catch (error) {
    logger.error(`Error fetching league analyses: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch league analyses' });
  }
});

// Get a specific analysis by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('league')
      .populate('weeklyPerformance.topPerformers.player')
      .populate('weeklyPerformance.missedOpportunities.player')
      .populate('weeklyPerformance.zeroPointPlayers.player')
      .populate('playerTrends.trendingUp.player')
      .populate('playerTrends.trendingDown.player')
      .populate('waiverRecommendations.player');
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Check if user has access to this analysis
    if (analysis.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have access to this analysis' });
    }
    
    res.json({ analysis });
  } catch (error) {
    logger.error(`Error fetching analysis: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Generate a new analysis for a specific league and week
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { leagueId, week } = req.body;
    const currentYear = new Date().getFullYear();
    
    if (!leagueId || !week) {
      return res.status(400).json({ error: 'League ID and week are required' });
    }
    
    // Find the league
    const league = await League.findById(leagueId);
    
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
    
    // Find the roster for this week
    const roster = await Roster.findOne({
      league: league._id,
      'team.platformTeamId': userTeam.platformTeamId,
      week: parseInt(week),
      season: currentYear
    }).populate('players.player');
    
    if (!roster) {
      return res.status(404).json({ 
        error: 'Roster not found',
        message: 'Please sync your roster data for this week first'
      });
    }
    
    // Generate the analysis
    const analysis = await analysisService.generateWeeklyAnalysis(
      req.user,
      league,
      roster,
      parseInt(week),
      currentYear
    );
    
    res.json({ 
      success: true,
      message: 'Analysis generated successfully',
      analysis
    });
  } catch (error) {
    logger.error(`Error generating analysis: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// Schedule weekly analysis generation for all leagues
router.post('/schedule', isAuthenticated, async (req, res) => {
  try {
    const { day, time } = req.body;
    
    if (!day || !time) {
      return res.status(400).json({ error: 'Day and time are required' });
    }
    
    // Validate day (0-6, where 0 is Sunday)
    if (day < 0 || day > 6) {
      return res.status(400).json({ error: 'Day must be between 0 (Sunday) and 6 (Saturday)' });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: 'Time must be in HH:MM format (24-hour)' });
    }
    
    // Update user's preferences
    req.user.analysisSchedule = {
      day,
      time,
      enabled: true
    };
    
    await req.user.save();
    
    res.json({ 
      success: true,
      message: 'Analysis schedule updated successfully',
      schedule: req.user.analysisSchedule
    });
  } catch (error) {
    logger.error(`Error scheduling analysis: ${error.message}`);
    res.status(500).json({ error: 'Failed to schedule analysis' });
  }
});

// Toggle scheduled analysis
router.post('/schedule/toggle', isAuthenticated, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({ error: 'Enabled status is required' });
    }
    
    // Check if schedule exists
    if (!req.user.analysisSchedule) {
      return res.status(400).json({ error: 'No analysis schedule found. Please create one first.' });
    }
    
    // Update enabled status
    req.user.analysisSchedule.enabled = enabled;
    await req.user.save();
    
    res.json({ 
      success: true,
      message: `Scheduled analysis ${enabled ? 'enabled' : 'disabled'} successfully`,
      schedule: req.user.analysisSchedule
    });
  } catch (error) {
    logger.error(`Error toggling analysis schedule: ${error.message}`);
    res.status(500).json({ error: 'Failed to toggle analysis schedule' });
  }
});

module.exports = router;
