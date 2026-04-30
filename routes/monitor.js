const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const Alert = require('../models/Alert');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Define some malicious domains or simplistic rules for backend detection
const BLACKLISTED_DOMAINS = ['malicious.com', 'phishing.net'];
const SOCIAL_DOMAINS = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'reddit.com'];

// Helper to check if time is during work hours (Mon-Fri, 9am-5pm)
function isWorkHours(date) {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const hour = date.getHours();
  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHour = hour >= 9 && hour < 17; // 9:00 AM to 4:59 PM
  return isWeekday && isWorkingHour;
}

// POST /api/logs (Ingest logs from extension)
router.post('/logs', authMiddleware, async (req, res) => {
  try {
    const logs = req.body; // Expecting an array of logs
    
    if (!Array.isArray(logs)) {
      return res.status(400).json({ message: 'Expected an array of logs' });
    }
    
    const formattedLogs = logs.map(log => {
      // Very basic backend flagging logic:
      let isFlagged = log.flagged || false;
      let alertReason = null;
      
      const logDate = log.timestamp ? new Date(log.timestamp) : new Date();

      try {
        if(log.url) {
            const urlObj = new URL(log.url);
            const hostname = urlObj.hostname.toLowerCase();

            if (BLACKLISTED_DOMAINS.some(domain => hostname.includes(domain))) {
                isFlagged = true;
                alertReason = `Visited blacklisted site: ${hostname}`;
            }
            
            // Check social media during work hours
            if (SOCIAL_DOMAINS.some(domain => hostname.includes(domain))) {
                if (isWorkHours(logDate)) {
                    isFlagged = true;
                    alertReason = `Social media accessed during work hours: ${hostname}`;
                }
            }
        }
      } catch(e) {} // ignore invalid URLs for flagging mechanism

      // Default reason if it was flagged by the extension but not the backend
      if (isFlagged && !alertReason) {
         alertReason = `Suspicious activity detected: ${log.actionType} on ${log.url}`;
      }

      return {
        userId: req.user.id,
        url: log.url,
        timestamp: logDate,
        tabId: log.tabId,
        actionType: log.actionType,
        flagged: isFlagged,
        _alertReason: alertReason // internal use for generating alerts
      };
    });

    // Remove the internal property before saving to DB
    const logsToSave = formattedLogs.map(log => {
      const { _alertReason, ...rest } = log;
      return rest;
    });

    const insertedLogs = await Log.insertMany(logsToSave);

    // If any logs were flagged, create an alert
    const flaggedLogs = formattedLogs.filter(log => log.flagged);
    if (flaggedLogs.length > 0) {
      const alerts = flaggedLogs.map(log => ({
         userId: req.user.id,
         message: log._alertReason,
         timestamp: log.timestamp
      }));
      await Alert.insertMany(alerts);
    }

    res.status(201).json({ message: 'Logs processed successfully', insertedCount: insertedLogs.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/logs (Admin only)
router.get('/logs', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const logs = await Log.find().populate('userId', 'email').sort({ timestamp: -1 });
    res.json(logs);
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/alerts (Admin only)
router.get('/alerts', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const alerts = await Alert.find().populate('userId', 'email').sort({ timestamp: -1 });
    res.json(alerts);
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/logs/:id (Admin only)
router.delete('/logs/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/logs (Admin only) - Clear all logs
router.delete('/logs', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'All logs deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/alerts/:id (Admin only)
router.delete('/alerts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/alerts (Admin only) - Clear all alerts
router.delete('/alerts', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    await Alert.deleteMany({});
    res.json({ message: 'All alerts deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
