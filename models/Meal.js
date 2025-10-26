const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide meal name'],
    trim: true,
    maxlength: [100, 'Meal name cannot exceed 100 characters']
  },
  mealType: {
    type: String,
    required: [true, 'Please specify meal type'],
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  date: {
    type: Date,
    required: [true, 'Please provide the meal date'],
    default: Date.now
  },
  foods: [{
    name: {
      type: String,
      required: [true, 'Please provide food name'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [0.1, 'Quantity must be at least 0.1']
    },
    unit: {
      type: String,
      required: [true, 'Please provide unit'],
      enum: ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'serving']
    },
    calories: {
      type: Number,
      required: [true, 'Please provide calories per unit'],
      min: [0, 'Calories cannot be negative']
    },
    protein: {
      type: Number,
      default: 0,
      min: [0, 'Protein cannot be negative']
    },
    carbs: {
      type: Number,
      default: 0,
      min: [0, 'Carbs cannot be negative']
    },
    fat: {
      type: Number,
      default: 0,
      min: [0, 'Fat cannot be negative']
    },
    fiber: {
      type: Number,
      default: 0,
      min: [0, 'Fiber cannot be negative']
    },
    sugar: {
      type: Number,
      default: 0,
      min: [0, 'Sugar cannot be negative']
    }
  }],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  totalFiber: {
    type: Number,
    default: 0
  },
  totalSugar: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate totals before saving
mealSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Method to calculate nutritional totals
mealSchema.methods.calculateTotals = function() {
  this.totalCalories = 0;
  this.totalProtein = 0;
  this.totalCarbs = 0;
  this.totalFat = 0;
  this.totalFiber = 0;
  this.totalSugar = 0;

  this.foods.forEach(food => {
    this.totalCalories += food.calories * food.quantity;
    this.totalProtein += food.protein * food.quantity;
    this.totalCarbs += food.carbs * food.quantity;
    this.totalFat += food.fat * food.quantity;
    this.totalFiber += food.fiber * food.quantity;
    this.totalSugar += food.sugar * food.quantity;
  });

  // Round to 2 decimal places
  this.totalCalories = Math.round(this.totalCalories * 100) / 100;
  this.totalProtein = Math.round(this.totalProtein * 100) / 100;
  this.totalCarbs = Math.round(this.totalCarbs * 100) / 100;
  this.totalFat = Math.round(this.totalFat * 100) / 100;
  this.totalFiber = Math.round(this.totalFiber * 100) / 100;
  this.totalSugar = Math.round(this.totalSugar * 100) / 100;
};

// Static method to get daily nutrition summary
mealSchema.statics.getDailyNutrition = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalCalories: { $sum: '$totalCalories' },
        totalProtein: { $sum: '$totalProtein' },
        totalCarbs: { $sum: '$totalCarbs' },
        totalFat: { $sum: '$totalFat' },
        totalFiber: { $sum: '$totalFiber' },
        totalSugar: { $sum: '$totalSugar' },
        mealCount: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Meal', mealSchema);
