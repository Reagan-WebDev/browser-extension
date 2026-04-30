const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const Alert = require('../models/Alert');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Define some malicious domains or simplistic rules for backend detection
const BLACKLISTED_DOMAINS = ['malicious.com', 'phishing.net'];

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
      
      try {
        if(log.url) {
            const urlObj = new URL(log.url);
            if (BLACKLISTED_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
                isFlagged = true;
            }
        }
      } catch(e) {} // ignore invalid URLs for flagging mechanism

      return {
        userId: req.user.id,
        url: log.url,
        timestamp: log.timestamp || new Date(),
        tabId: log.tabId,
        actionType: log.actionType,
        flagged: isFlagged
      };
    });

    const insertedLogs = await Log.insertMany(formattedLogs);

    // If any logs were flagged, create an alert
    const flaggedLogs = insertedLogs.filter(log => log.flagged);
    if (flaggedLogs.length > 0) {
      const alerts = flaggedLogs.map(log => ({
         userId: req.user.id,
         message: `Suspicious activity detected: ${log.actionType} on ${log.url}`,
         timestamp: new Date()
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
