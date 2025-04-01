const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  platforms: [{
    platform: {
      type: String,
      enum: ['espn', 'sleeper', 'fantrax'],
      required: true
    },
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    userId: String,
    username: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

module.exports = mongoose.model('User', UserSchema);
