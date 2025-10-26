const express = require('express');
const { body, validationResult } = require('express-validator');
const Meal = require('../models/Meal');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all meals for user
// @route   GET /api/meals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, date, mealType } = req.query;
    const query = { user: req.user.id };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by meal type if provided
    if (mealType) {
      query.mealType = mealType;
    }

    const meals = await Meal.find(query)
      .populate('user', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Meal.countDocuments(query);

    res.json({
      success: true,
      count: meals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: meals
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single meal
// @route   GET /api/meals/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'name');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new meal
// @route   POST /api/meals
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Meal name must be between 1 and 100 characters'),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('foods').isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('foods.*.name').notEmpty().withMessage('Food name is required'),
  body('foods.*.quantity').isFloat({ min: 0.1 }).withMessage('Quantity must be at least 0.1'),
  body('foods.*.unit').isIn(['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'serving']).withMessage('Invalid unit'),
  body('foods.*.calories').isFloat({ min: 0 }).withMessage('Calories cannot be negative'),
  body('foods.*.protein').optional().isFloat({ min: 0 }).withMessage('Protein cannot be negative'),
  body('foods.*.carbs').optional().isFloat({ min: 0 }).withMessage('Carbs cannot be negative'),
  body('foods.*.fat').optional().isFloat({ min: 0 }).withMessage('Fat cannot be negative'),
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

    const { name, mealType, date, foods, notes } = req.body;

    // Create meal
    const meal = await Meal.create({
      user: req.user.id,
      name,
      mealType,
      date: date || new Date(),
      foods,
      notes
    });

    // Populate user data
    await meal.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: meal
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal creation'
    });
  }
});

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Meal name must be between 1 and 100 characters'),
  body('mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('foods').optional().isArray({ min: 1 }).withMessage('At least one food item is required'),
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

    let meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Update meal
    meal = await Meal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name');

    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: meal
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal update'
    });
  }
});

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    await Meal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal deletion'
    });
  }
});

// @desc    Get daily nutrition summary
// @route   GET /api/meals/nutrition/daily
// @access  Private
router.get('/nutrition/daily', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const nutritionSummary = await Meal.getDailyNutrition(req.user.id, targetDate);

    res.json({
      success: true,
      data: {
        date: targetDate,
        nutrition: nutritionSummary[0] || {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          mealCount: 0
        }
      }
    });
  } catch (error) {
    console.error('Get daily nutrition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get nutrition statistics
// @route   GET /api/meals/nutrition/stats
// @access  Private
router.get('/nutrition/stats', protect, async (req, res) => {
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

    const stats = await Meal.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          averageCalories: { $avg: '$totalCalories' },
          averageProtein: { $avg: '$totalProtein' },
          averageCarbs: { $avg: '$totalCarbs' },
          averageFat: { $avg: '$totalFat' },
          totalCalories: { $sum: '$totalCalories' },
          totalProtein: { $sum: '$totalProtein' },
          totalCarbs: { $sum: '$totalCarbs' },
          totalFat: { $sum: '$totalFat' }
        }
      }
    ]);

    // Get meal type breakdown
    const mealTypeBreakdown = await Meal.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 },
          averageCalories: { $avg: '$totalCalories' },
          totalCalories: { $sum: '$totalCalories' }
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
          totalMeals: 0,
          averageCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0
        },
        mealTypeBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get nutrition stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get common foods database
// @route   GET /api/meals/foods/common
// @access  Public
router.get('/foods/common', (req, res) => {
  const commonFoods = [
    // Fruits
    { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10.4 },
    { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12.2 },
    { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9.4 },
    
    // Vegetables
    { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5 },
    { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7 },
    { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
    
    // Proteins
    { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
    { name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, sugar: 0 },
    { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1 },
    
    // Grains
    { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4 },
    { name: 'Oats', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, sugar: 1 },
    { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8, sugar: 0.9 },
    
    // Dairy
    { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6 },
    { name: 'Milk (2%)', calories: 50, protein: 3.3, carbs: 4.7, fat: 2, fiber: 0, sugar: 4.7 },
    { name: 'Cheese (Cheddar)', calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0, sugar: 0.4 }
  ];

  res.json({
    success: true,
    data: commonFoods
  });
});

module.exports = router;
