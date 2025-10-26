const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all workouts for user
// @route   GET /api/workouts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, date, exerciseType } = req.query;
    const query = { user: req.user.id };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by exercise type if provided
    if (exerciseType) {
      query.exerciseType = exerciseType;
    }

    const workouts = await Workout.find(query)
      .populate('user', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Workout.countDocuments(query);

    res.json({
      success: true,
      count: workouts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: workouts
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single workout
// @route   GET /api/workouts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'name');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    res.json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new workout
// @route   POST /api/workouts
// @access  Private
router.post('/', protect, [
  body('exerciseType').notEmpty().withMessage('Exercise type is required'),
  body('intensity').notEmpty().withMessage('Intensity is required'),
  body('duration').isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
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

    const { exerciseType, intensity, duration, date, notes } = req.body;

    // Validate exercise type and intensity combination
    const availableIntensities = Workout.getIntensities(exerciseType);
    if (!availableIntensities.includes(intensity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid intensity for ${exerciseType}. Available intensities: ${availableIntensities.join(', ')}`
      });
    }

    // Create workout
    const workout = await Workout.create({
      user: req.user.id,
      exerciseType,
      intensity,
      duration,
      date: date || new Date(),
      notes
    });

    // Calculate calories burned
    await workout.calculateCaloriesBurned();
    await workout.save();

    // Populate user data
    await workout.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Workout created successfully',
      data: workout
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during workout creation'
    });
  }
});

// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private
router.put('/:id', protect, [
  body('exerciseType').optional().notEmpty().withMessage('Exercise type cannot be empty'),
  body('intensity').optional().notEmpty().withMessage('Intensity cannot be empty'),
  body('duration').optional().isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
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

    let workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    // Validate exercise type and intensity combination if provided
    if (req.body.exerciseType && req.body.intensity) {
      const availableIntensities = Workout.getIntensities(req.body.exerciseType);
      if (!availableIntensities.includes(req.body.intensity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid intensity for ${req.body.exerciseType}. Available intensities: ${availableIntensities.join(', ')}`
        });
      }
    }

    // Update workout
    workout = await Workout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name');

    res.json({
      success: true,
      message: 'Workout updated successfully',
      data: workout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during workout update'
    });
  }
});

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    await Workout.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during workout deletion'
    });
  }
});

// @desc    Get workout statistics
// @route   GET /api/workouts/stats/summary
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

    const stats = await Workout.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          averageDuration: { $avg: '$duration' },
          averageCaloriesBurned: { $avg: '$caloriesBurned' }
        }
      }
    ]);

    // Get exercise type breakdown
    const exerciseBreakdown = await Workout.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$exerciseType',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$caloriesBurned' }
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
          totalWorkouts: 0,
          totalDuration: 0,
          totalCaloriesBurned: 0,
          averageDuration: 0,
          averageCaloriesBurned: 0
        },
        exerciseBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get workout stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get available exercise types and intensities
// @route   GET /api/workouts/exercise-types
// @access  Public
router.get('/exercise-types', (req, res) => {
  const exerciseTypes = {
    running: ['5 mph', '6 mph', '7 mph', '8 mph', '9 mph', '10 mph'],
    cycling: ['leisurely', 'moderate', 'vigorous', 'racing'],
    swimming: ['leisurely', 'moderate', 'vigorous'],
    yoga: ['hatha', 'power', 'vinyasa'],
    weightlifting: ['light', 'moderate', 'vigorous'],
    walking: ['slow', 'moderate', 'brisk', 'very_brisk'],
    dancing: ['slow', 'moderate', 'fast'],
    basketball: ['casual', 'competitive'],
    soccer: ['casual', 'competitive'],
    tennis: ['singles', 'doubles'],
    hiking: ['easy', 'moderate', 'strenuous']
  };

  res.json({
    success: true,
    data: exerciseTypes
  });
});

module.exports = router;
