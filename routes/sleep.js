const express = require('express');
const { body, validationResult } = require('express-validator');
const Sleep = require('../models/Sleep');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all sleep records for user
// @route   GET /api/sleep
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, date } = req.query;
    const query = { user: req.user.id };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const sleepRecords = await Sleep.find(query)
      .populate('user', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sleep.countDocuments(query);

    res.json({
      success: true,
      count: sleepRecords.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: sleepRecords
    });
  } catch (error) {
    console.error('Get sleep records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single sleep record
// @route   GET /api/sleep/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const sleepRecord = await Sleep.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'name');

    if (!sleepRecord) {
      return res.status(404).json({
        success: false,
        message: 'Sleep record not found'
      });
    }

    res.json({
      success: true,
      data: sleepRecord
    });
  } catch (error) {
    console.error('Get sleep record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new sleep record
// @route   POST /api/sleep
// @access  Private
router.post('/', protect, [
  body('sleepStart').isISO8601().withMessage('Invalid sleep start time format'),
  body('sleepEnd').isISO8601().withMessage('Invalid sleep end time format'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('quality').optional().isIn(['poor', 'fair', 'good', 'excellent']).withMessage('Invalid sleep quality'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sleepStart, sleepEnd, date, quality, notes } = req.body;

    // Validate that sleep end is after sleep start
    const startTime = new Date(sleepStart);
    const endTime = new Date(sleepEnd);
    
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'Sleep end time must be after sleep start time'
      });
    }

    // Create sleep record
    const sleepRecord = await Sleep.create({
      user: req.user.id,
      sleepStart,
      sleepEnd,
      date: date || new Date(),
      quality: quality || 'good',
      notes
    });

    // Populate user data
    await sleepRecord.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Sleep record created successfully',
      data: sleepRecord
    });
  } catch (error) {
    console.error('Create sleep record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sleep record creation'
    });
  }
});

// @desc    Update sleep record
// @route   PUT /api/sleep/:id
// @access  Private
router.put('/:id', protect, [
  body('sleepStart').optional().isISO8601().withMessage('Invalid sleep start time format'),
  body('sleepEnd').optional().isISO8601().withMessage('Invalid sleep end time format'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('quality').optional().isIn(['poor', 'fair', 'good', 'excellent']).withMessage('Invalid sleep quality'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let sleepRecord = await Sleep.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!sleepRecord) {
      return res.status(404).json({
        success: false,
        message: 'Sleep record not found'
      });
    }

    // Validate sleep times if both are provided
    if (req.body.sleepStart && req.body.sleepEnd) {
      const startTime = new Date(req.body.sleepStart);
      const endTime = new Date(req.body.sleepEnd);
      
      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'Sleep end time must be after sleep start time'
        });
      }
    }

    // Update sleep record
    sleepRecord = await Sleep.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name');

    res.json({
      success: true,
      message: 'Sleep record updated successfully',
      data: sleepRecord
    });
  } catch (error) {
    console.error('Update sleep record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sleep record update'
    });
  }
});

// @desc    Delete sleep record
// @route   DELETE /api/sleep/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const sleepRecord = await Sleep.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!sleepRecord) {
      return res.status(404).json({
        success: false,
        message: 'Sleep record not found'
      });
    }

    await Sleep.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Sleep record deleted successfully'
    });
  } catch (error) {
    console.error('Delete sleep record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sleep record deletion'
    });
  }
});

// @desc    Get sleep statistics
// @route   GET /api/sleep/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const stats = await Sleep.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSleepRecords: { $sum: 1 },
          averageDuration: { $avg: '$duration' },
          totalSleepTime: { $sum: '$duration' },
          averageQuality: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$quality', 'poor'] }, then: 25 },
                  { case: { $eq: ['$quality', 'fair'] }, then: 50 },
                  { case: { $eq: ['$quality', 'good'] }, then: 75 },
                  { case: { $eq: ['$quality', 'excellent'] }, then: 100 }
                ],
                default: 75
              }
            }
          }
        }
      }
    ]);

    // Get quality breakdown
    const qualityBreakdown = await Sleep.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$quality',
          count: { $sum: 1 },
          averageDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalSleepRecords: 0,
          averageDuration: 0,
          totalSleepTime: 0,
          averageQuality: 0
        },
        qualityBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get sleep stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get weekly sleep summary
// @route   GET /api/sleep/stats/weekly
// @access  Private
router.get('/stats/weekly', protect, async (req, res) => {
  try {
    const { startDate } = req.query;
    const weekStart = startDate ? new Date(startDate) : new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const weeklySummary = await Sleep.getWeeklySummary(req.user.id, weekStart);

    res.json({
      success: true,
      data: {
        weekStart,
        summary: weeklySummary[0] || {
          averageDuration: 0,
          totalSleepTime: 0,
          sleepDays: 0,
          averageQuality: 0
        }
      }
    });
  } catch (error) {
    console.error('Get weekly sleep summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get sleep trends
// @route   GET /api/sleep/trends
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await Sleep.getSleepTrends(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get sleep trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
