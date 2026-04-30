const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tabId: {
    type: Number
  },
  actionType: {
    type: String,
    required: true
  },
  flagged: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Log', logSchema);
