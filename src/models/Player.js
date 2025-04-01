const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    enum: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'],
    required: true
  },
  team: String,
  platformIds: {
    espn: String,
    sleeper: String,
    fantrax: String
  },
  stats: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  projections: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  trends: {
    snapShare: [Number],
    targets: [Number],
    touches: [Number],
    redZoneUsage: [Number]
  },
  news: [{
    date: Date,
    content: String,
    source: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness across name and position
PlayerSchema.index({ name: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Player', PlayerSchema);
