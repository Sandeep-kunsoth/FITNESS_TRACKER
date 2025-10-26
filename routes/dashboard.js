const express = require('express');
const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const Sleep = require('../models/Sleep');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Get start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get start of week (Sunday)
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get start of month
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);

    // Parallel data fetching
    const [
      dailyWorkouts,
      dailyMeals,
      dailySleep,
      weeklyWorkouts,
      weeklyMeals,
      weeklySleep,
      monthlyProgress,
      recentProgress
    ] = await Promise.all([
      // Daily data
      Workout.find({
        user: req.user.id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ date: -1 }),

      Meal.find({
        user: req.user.id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ date: -1 }),

      Sleep.find({
        user: req.user.id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ date: -1 }),

      // Weekly data
      Workout.find({
        user: req.user.id,
        date: { $gte: startOfWeek }
      }).sort({ date: -1 }),

      Meal.find({
        user: req.user.id,
        date: { $gte: startOfWeek }
      }).sort({ date: -1 }),

      Sleep.find({
        user: req.user.id,
        date: { $gte: startOfWeek }
      }).sort({ date: -1 }),

      // Monthly progress
      Progress.find({
        user: req.user.id,
        date: { $gte: startOfMonth }
      }).sort({ date: -1 }),

      // Recent progress (last 30 days)
      Progress.find({
        user: req.user.id,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ date: -1 }).limit(10)
    ]);

    // Calculate daily summaries
    const dailySummary = {
      workouts: {
        count: dailyWorkouts.length,
        totalDuration: dailyWorkouts.reduce((sum, w) => sum + w.duration, 0),
        totalCalories: dailyWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
        averageDuration: dailyWorkouts.length > 0 ? 
          Math.round(dailyWorkouts.reduce((sum, w) => sum + w.duration, 0) / dailyWorkouts.length) : 0
      },
      meals: {
        count: dailyMeals.length,
        totalCalories: dailyMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        totalProtein: dailyMeals.reduce((sum, m) => sum + m.totalProtein, 0),
        totalCarbs: dailyMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
        totalFat: dailyMeals.reduce((sum, m) => sum + m.totalFat, 0)
      },
      sleep: {
        count: dailySleep.length,
        totalDuration: dailySleep.reduce((sum, s) => sum + s.duration, 0),
        averageDuration: dailySleep.length > 0 ? 
          Math.round(dailySleep.reduce((sum, s) => sum + s.duration, 0) / dailySleep.length) : 0,
        averageQuality: dailySleep.length > 0 ? 
          Math.round(dailySleep.reduce((sum, s) => sum + s.getQualityScore(), 0) / dailySleep.length) : 0
      }
    };

    // Calculate weekly summaries
    const weeklySummary = {
      workouts: {
        count: weeklyWorkouts.length,
        totalDuration: weeklyWorkouts.reduce((sum, w) => sum + w.duration, 0),
        totalCalories: weeklyWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
        averageDuration: weeklyWorkouts.length > 0 ? 
          Math.round(weeklyWorkouts.reduce((sum, w) => sum + w.duration, 0) / weeklyWorkouts.length) : 0
      },
      meals: {
        count: weeklyMeals.length,
        totalCalories: weeklyMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        totalProtein: weeklyMeals.reduce((sum, m) => sum + m.totalProtein, 0),
        totalCarbs: weeklyMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
        totalFat: weeklyMeals.reduce((sum, m) => sum + m.totalFat, 0)
      },
      sleep: {
        count: weeklySleep.length,
        totalDuration: weeklySleep.reduce((sum, s) => sum + s.duration, 0),
        averageDuration: weeklySleep.length > 0 ? 
          Math.round(weeklySleep.reduce((sum, s) => sum + s.duration, 0) / weeklySleep.length) : 0,
        averageQuality: weeklySleep.length > 0 ? 
          Math.round(weeklySleep.reduce((sum, s) => sum + s.getQualityScore(), 0) / weeklySleep.length) : 0
      }
    };

    // Calculate progress summary
    const progressSummary = {
      currentWeight: recentProgress.length > 0 ? recentProgress[0].weight : req.user.weight,
      weightChange: recentProgress.length > 1 ? 
        recentProgress[0].weight - recentProgress[recentProgress.length - 1].weight : 0,
      monthlyEntries: monthlyProgress.length,
      recentEntries: recentProgress.slice(0, 5)
    };

    // Calculate BMI if we have recent progress
    let currentBMI = null;
    if (recentProgress.length > 0) {
      const heightInMeters = req.user.height / 100;
      currentBMI = (recentProgress[0].weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    // Get exercise type breakdown for the week
    const exerciseBreakdown = weeklyWorkouts.reduce((acc, workout) => {
      acc[workout.exerciseType] = (acc[workout.exerciseType] || 0) + 1;
      return acc;
    }, {});

    // Get meal type breakdown for the week
    const mealTypeBreakdown = weeklyMeals.reduce((acc, meal) => {
      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
      return acc;
    }, {});

    // Calculate calorie balance
    const dailyCalorieIntake = dailySummary.meals.totalCalories;
    const dailyCalorieBurned = dailySummary.workouts.totalCalories;
    const dailyCalorieBalance = dailyCalorieIntake - dailyCalorieBurned;

    // Get user's daily calorie needs
    const dailyCalorieNeeds = req.user.calculateDailyCalories();

    res.json({
      success: true,
      data: {
        date: targetDate,
        user: {
          name: req.user.name,
          weight: req.user.weight,
          height: req.user.height,
          bmi: req.user.calculateBMI(),
          dailyCalorieNeeds,
          goal: req.user.goal,
          targetWeight: req.user.targetWeight
        },
        daily: {
          summary: dailySummary,
          calorieBalance: dailyCalorieBalance,
          calorieNeeds: dailyCalorieNeeds,
          calorieDeficit: dailyCalorieNeeds - dailyCalorieIntake,
          workouts: dailyWorkouts,
          meals: dailyMeals,
          sleep: dailySleep
        },
        weekly: {
          summary: weeklySummary,
          exerciseBreakdown,
          mealTypeBreakdown
        },
        progress: {
          ...progressSummary,
          currentBMI,
          goalProgress: req.user.targetWeight ? 
            Math.abs(((req.user.targetWeight - progressSummary.currentWeight) / (req.user.weight - req.user.targetWeight)) * 100) : 0
        },
        charts: {
          weightTrend: recentProgress.map(p => ({
            date: p.date,
            weight: p.weight
          })),
          weeklyCalories: Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayMeals = weeklyMeals.filter(m => 
              m.date >= dayStart && m.date <= dayEnd
            );
            const dayWorkouts = weeklyWorkouts.filter(w => 
              w.date >= dayStart && w.date <= dayEnd
            );
            
            return {
              date: day.toISOString().split('T')[0],
              intake: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
              burned: dayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0)
            };
          })
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
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
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get aggregated statistics
    const [workoutStats, mealStats, sleepStats, progressStats] = await Promise.all([
      Workout.aggregate([
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
            totalCalories: { $sum: '$caloriesBurned' },
            averageDuration: { $avg: '$duration' },
            averageCalories: { $avg: '$caloriesBurned' }
          }
        }
      ]),
      Meal.aggregate([
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
            totalCalories: { $sum: '$totalCalories' },
            totalProtein: { $sum: '$totalProtein' },
            totalCarbs: { $sum: '$totalCarbs' },
            totalFat: { $sum: '$totalFat' },
            averageCalories: { $avg: '$totalCalories' }
          }
        }
      ]),
      Sleep.aggregate([
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
            totalSleepTime: { $sum: '$duration' },
            averageDuration: { $avg: '$duration' },
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
      ]),
      Progress.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDate }
          }
        },
        {
          $sort: { date: 1 }
        },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            currentWeight: { $last: '$weight' },
            startingWeight: { $first: '$weight' },
            weightChange: { $subtract: [{ $last: '$weight' }, { $first: '$weight' }] },
            averageWeight: { $avg: '$weight' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period,
        workouts: workoutStats[0] || {
          totalWorkouts: 0,
          totalDuration: 0,
          totalCalories: 0,
          averageDuration: 0,
          averageCalories: 0
        },
        meals: mealStats[0] || {
          totalMeals: 0,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          averageCalories: 0
        },
        sleep: sleepStats[0] || {
          totalSleepRecords: 0,
          totalSleepTime: 0,
          averageDuration: 0,
          averageQuality: 0
        },
        progress: progressStats[0] || {
          totalEntries: 0,
          currentWeight: 0,
          startingWeight: 0,
          weightChange: 0,
          averageWeight: 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
