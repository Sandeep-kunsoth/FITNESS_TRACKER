const express = require('express');
const { body, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all progress records for user
// @route   GET /api/progress
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

    const progressRecords = await Progress.find(query)
      .populate('user', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Progress.countDocuments(query);

    res.json({
      success: true,
      count: progressRecords.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: progressRecords
    });
  } catch (error) {
    console.error('Get progress records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single progress record
// @route   GET /api/progress/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const progressRecord = await Progress.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'name');

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Calculate BMI and category
    const bmiData = await progressRecord.getBMICategory();

    res.json({
      success: true,
      data: {
        ...progressRecord.toObject(),
        bmi: bmiData.bmi,
        bmiCategory: bmiData.category
      }
    });
  } catch (error) {
    console.error('Get progress record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new progress record
// @route   POST /api/progress
// @access  Private
router.post('/', protect, [
  body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('bodyFat').optional().isFloat({ min: 1, max: 50 }).withMessage('Body fat percentage must be between 1 and 50%'),
  body('muscleMass').optional().isFloat({ min: 10, max: 100 }).withMessage('Muscle mass must be between 10 and 100 kg'),
  body('measurements.chest').optional().isFloat({ min: 0 }).withMessage('Chest measurement cannot be negative'),
  body('measurements.waist').optional().isFloat({ min: 0 }).withMessage('Waist measurement cannot be negative'),
  body('measurements.hips').optional().isFloat({ min: 0 }).withMessage('Hips measurement cannot be negative'),
  body('measurements.arms').optional().isFloat({ min: 0 }).withMessage('Arms measurement cannot be negative'),
  body('measurements.thighs').optional().isFloat({ min: 0 }).withMessage('Thighs measurement cannot be negative'),
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

    const { weight, date, bodyFat, muscleMass, measurements, notes } = req.body;

    // Create progress record
    const progressRecord = await Progress.create({
      user: req.user.id,
      weight,
      date: date || new Date(),
      bodyFat,
      muscleMass,
      measurements,
      notes
    });

    // Calculate BMI and category
    const bmiData = await progressRecord.getBMICategory();

    // Populate user data
    await progressRecord.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Progress record created successfully',
      data: {
        ...progressRecord.toObject(),
        bmi: bmiData.bmi,
        bmiCategory: bmiData.category
      }
    });
  } catch (error) {
    console.error('Create progress record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during progress record creation'
    });
  }
});

// @desc    Update progress record
// @route   PUT /api/progress/:id
// @access  Private
router.put('/:id', protect, [
  body('weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('bodyFat').optional().isFloat({ min: 1, max: 50 }).withMessage('Body fat percentage must be between 1 and 50%'),
  body('muscleMass').optional().isFloat({ min: 10, max: 100 }).withMessage('Muscle mass must be between 10 and 100 kg'),
  body('measurements.chest').optional().isFloat({ min: 0 }).withMessage('Chest measurement cannot be negative'),
  body('measurements.waist').optional().isFloat({ min: 0 }).withMessage('Waist measurement cannot be negative'),
  body('measurements.hips').optional().isFloat({ min: 0 }).withMessage('Hips measurement cannot be negative'),
  body('measurements.arms').optional().isFloat({ min: 0 }).withMessage('Arms measurement cannot be negative'),
  body('measurements.thighs').optional().isFloat({ min: 0 }).withMessage('Thighs measurement cannot be negative'),
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

    let progressRecord = await Progress.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Update progress record
    progressRecord = await Progress.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name');

    // Calculate BMI and category
    const bmiData = await progressRecord.getBMICategory();

    res.json({
      success: true,
      message: 'Progress record updated successfully',
      data: {
        ...progressRecord.toObject(),
        bmi: bmiData.bmi,
        bmiCategory: bmiData.category
      }
    });
  } catch (error) {
    console.error('Update progress record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during progress record update'
    });
  }
});

// @desc    Delete progress record
// @route   DELETE /api/progress/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const progressRecord = await Progress.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    await Progress.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Progress record deleted successfully'
    });
  } catch (error) {
    console.error('Delete progress record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during progress record deletion'
    });
  }
});

// @desc    Get weight progress
// @route   GET /api/progress/weight/trends
// @access  Private
router.get('/weight/trends', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const weightProgress = await Progress.getWeightProgress(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: weightProgress
    });
  } catch (error) {
    console.error('Get weight progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get progress summary
// @route   GET /api/progress/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const summary = await Progress.getProgressSummary(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: summary[0] || {
        currentWeight: 0,
        startingWeight: 0,
        weightChange: 0,
        averageWeight: 0,
        currentBodyFat: 0,
        startingBodyFat: 0,
        bodyFatChange: 0,
        currentMuscleMass: 0,
        startingMuscleMass: 0,
        muscleMassChange: 0,
        totalEntries: 0
      }
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get measurement progress
// @route   GET /api/progress/measurements
// @access  Private
router.get('/measurements', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const measurementProgress = await Progress.getMeasurementProgress(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: measurementProgress[0] || {
        currentChest: 0,
        startingChest: 0,
        chestChange: 0,
        currentWaist: 0,
        startingWaist: 0,
        waistChange: 0,
        currentHips: 0,
        startingHips: 0,
        hipsChange: 0,
        currentArms: 0,
        startingArms: 0,
        armsChange: 0,
        currentThighs: 0,
        startingThighs: 0,
        thighsChange: 0
      }
    });
  } catch (error) {
    console.error('Get measurement progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Calculate BMI
// @route   POST /api/progress/calculate-bmi
// @access  Private
router.post('/calculate-bmi', protect, [
  body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('height').isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm')
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

    const { weight, height } = req.body;

    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // Determine BMI category
    let category;
    if (bmi < 18.5) {
      category = 'Underweight';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Normal weight';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
    } else {
      category = 'Obese';
    }

    res.json({
      success: true,
      data: {
        bmi: parseFloat(bmi),
        category,
        weight,
        height
      }
    });
  } catch (error) {
    console.error('Calculate BMI error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
