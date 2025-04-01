const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  week: {
    type: Number,
    required: true
  },
  season: {
    type: Number,
    required: true
  },
  weeklyPerformance: {
    totalPoints: Number,
    result: {
      type: String,
      enum: ['win', 'loss', 'tie', 'pending']
    },
    topPerformers: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      points: Number,
      valueOverExpected: Number,
      analysis: String
    }],
    missedOpportunities: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      points: Number,
      analysis: String
    }],
    zeroPointPlayers: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      reason: String
    }]
  },
  playerTrends: {
    trendingUp: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      reason: String
    }],
    trendingDown: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      reason: String
    }]
  },
  waiverRecommendations: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    priority: {
      type: String,
      enum: ['high-priority', 'streamer', 'stash']
    },
    reason: String,
    ownershipPercentage: Number
  }],
  reportContent: {
    markdown: String,
    html: String
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness across user, league, week, and season
AnalysisSchema.index({ user: 1, league: 1, week: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);
