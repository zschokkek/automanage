const mongoose = require('mongoose');

const RosterSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  team: {
    platformTeamId: String,
    name: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  week: {
    type: Number,
    required: true
  },
  season: {
    type: Number,
    required: true
  },
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    position: String,
    starter: Boolean,
    score: Number,
    projectedScore: Number
  }],
  matchup: {
    opponent: {
      platformTeamId: String,
      name: String,
      score: Number
    },
    result: {
      type: String,
      enum: ['win', 'loss', 'tie', 'pending']
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness across league, team, week, and season
RosterSchema.index({ league: 1, 'team.platformTeamId': 1, week: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('Roster', RosterSchema);
