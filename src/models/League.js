const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['espn', 'sleeper', 'fantrax'],
    required: true
  },
  platformLeagueId: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    enum: ['football', 'baseball', 'basketball', 'hockey', 'other'],
    default: 'football'
  },
  season: {
    type: Number,
    required: true
  },
  scoringFormat: {
    type: String,
    enum: ['standard', 'ppr', 'half_ppr', 'custom'],
    default: 'standard'
  },
  rosterSettings: {
    // Football positions
    qb: Number,
    rb: Number,
    wr: Number,
    te: Number,
    flex: Number,
    superflex: Number,
    k: Number,
    dst: Number,
    
    // Baseball positions
    c: Number,
    '1b': Number,
    '2b': Number,
    '3b': Number,
    ss: Number,
    of: Number,
    util: Number,
    sp: Number,
    rp: Number,
    p: Number,
    
    // Common settings
    bench: Number,
    ir: Number
  },
  teams: [{
    platformTeamId: String,
    name: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    record: {
      wins: Number,
      losses: Number,
      ties: Number
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness across platform and platformLeagueId
LeagueSchema.index({ platform: 1, platformLeagueId: 1 }, { unique: true });

module.exports = mongoose.model('League', LeagueSchema);
