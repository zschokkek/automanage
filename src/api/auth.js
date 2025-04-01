const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Configure passport serialization
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Manual authentication routes
// ESPN manual login
router.post('/espn/manual', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }
    
    // Find or create user
    let user = null;
    
    if (email) {
      user = await User.findOne({ email });
    }
    
    if (!user && username) {
      user = await User.findOne({ username });
    }
    
    if (!user) {
      // Create new user
      user = new User({
        username: username || `espn_user_${Date.now()}`,
        email: email || `espn_${Date.now()}@example.com`,
        platforms: []
      });
    }
    
    // Check if user already has ESPN platform
    const hasPlatform = user.platforms.some(p => p.platform === 'espn');
    
    if (!hasPlatform) {
      // Add ESPN platform to user
      user.platforms.push({
        platform: 'espn',
        userId: email || username,
        username: username
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        logger.error(`Login error: ${err.message}`);
        return res.status(500).json({ error: 'Authentication failed' });
      }
      return res.json({ user: { id: user._id, username: user.username, email: user.email } });
    });
  } catch (error) {
    logger.error(`ESPN manual login error: ${error.message}`);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Sleeper manual login
router.post('/sleeper/manual', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ 'platforms.platform': 'sleeper', 'platforms.username': username });
    
    if (!user) {
      // Check if there's a user with the same username
      user = await User.findOne({ username });
      
      if (!user) {
        // Create new user
        user = new User({
          username,
          platforms: []
        });
      }
      
      // Add Sleeper platform to user
      user.platforms.push({
        platform: 'sleeper',
        userId: username,
        username
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        logger.error(`Login error: ${err.message}`);
        return res.status(500).json({ error: 'Authentication failed' });
      }
      return res.json({ user: { id: user._id, username: user.username } });
    });
  } catch (error) {
    logger.error(`Sleeper manual login error: ${error.message}`);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Fantrax manual login
router.post('/fantrax/manual', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ 'platforms.platform': 'fantrax', 'platforms.userId': email });
    
    if (!user) {
      // Check if there's a user with the same email
      user = await User.findOne({ email });
      
      if (!user) {
        // Create new user
        user = new User({
          email,
          username: email.split('@')[0],
          platforms: []
        });
      }
      
      // Add Fantrax platform to user
      user.platforms.push({
        platform: 'fantrax',
        userId: email,
        username: email.split('@')[0]
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        logger.error(`Login error: ${err.message}`);
        return res.status(500).json({ error: 'Authentication failed' });
      }
      return res.json({ user: { id: user._id, username: user.username, email: user.email } });
    });
  } catch (error) {
    logger.error(`Fantrax manual login error: ${error.message}`);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  
  res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
