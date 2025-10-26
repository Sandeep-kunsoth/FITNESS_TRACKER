const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide the progress date'],
    default: Date.now
  },
  weight: {
    type: Number,
    required: [true, 'Please provide current weight'],
    min: [20, 'Weight must be at least 20 kg'],
    max: [300, 'Weight must be less than 300 kg']
  },
  bodyFat: {
    type: Number,
    min: [1, 'Body fat percentage must be at least 1%'],
    max: [50, 'Body fat percentage must be less than 50%']
  },
  muscleMass: {
    type: Number,
    min: [10, 'Muscle mass must be at least 10 kg'],
    max: [100, 'Muscle mass must be less than 100 kg']
  },
  measurements: {
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    hips: { type: Number, min: 0 },
    arms: { type: Number, min: 0 },
    thighs: { type: Number, min: 0 }
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

// Calculate BMI before saving
progressSchema.pre('save', function(next) {
  if (this.isModified('weight')) {
    this.calculateBMI();
  }
  next();
});

// Method to calculate BMI
progressSchema.methods.calculateBMI = function() {
  return new Promise((resolve, reject) => {
    this.populate('user')
      .then(progress => {
        if (!progress.user) {
          reject(new Error('User not found'));
          return;
        }

        const heightInMeters = progress.user.height / 100;
        const bmi = progress.weight / (heightInMeters * heightInMeters);
        resolve(Math.round(bmi * 10) / 10);
      })
      .catch(reject);
  });
};

// Method to get BMI category
progressSchema.methods.getBMICategory = function() {
  return new Promise((resolve, reject) => {
    this.calculateBMI()
      .then(bmi => {
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
        resolve({ bmi, category });
      })
      .catch(reject);
  });
};

// Static method to get weight progress
progressSchema.statics.getWeightProgress = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    date: { $gte: startDate }
  })
  .sort({ date: 1 })
  .select('date weight bodyFat muscleMass');
};

// Static method to get progress summary
progressSchema.statics.getProgressSummary = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: null,
        currentWeight: { $last: '$weight' },
        startingWeight: { $first: '$weight' },
        weightChange: { $subtract: [{ $last: '$weight' }, { $first: '$weight' }] },
        averageWeight: { $avg: '$weight' },
        currentBodyFat: { $last: '$bodyFat' },
        startingBodyFat: { $first: '$bodyFat' },
        bodyFatChange: { $subtract: [{ $last: '$bodyFat' }, { $first: '$bodyFat' }] },
        currentMuscleMass: { $last: '$muscleMass' },
        startingMuscleMass: { $first: '$muscleMass' },
        muscleMassChange: { $subtract: [{ $last: '$muscleMass' }, { $first: '$muscleMass' }] },
        totalEntries: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get measurement progress
progressSchema.statics.getMeasurementProgress = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate },
        'measurements.chest': { $exists: true, $ne: null }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: null,
        currentChest: { $last: '$measurements.chest' },
        startingChest: { $first: '$measurements.chest' },
        chestChange: { $subtract: [{ $last: '$measurements.chest' }, { $first: '$measurements.chest' }] },
        currentWaist: { $last: '$measurements.waist' },
        startingWaist: { $first: '$measurements.waist' },
        waistChange: { $subtract: [{ $last: '$measurements.waist' }, { $first: '$measurements.waist' }] },
        currentHips: { $last: '$measurements.hips' },
        startingHips: { $first: '$measurements.hips' },
        hipsChange: { $subtract: [{ $last: '$measurements.hips' }, { $first: '$measurements.hips' }] },
        currentArms: { $last: '$measurements.arms' },
        startingArms: { $first: '$measurements.arms' },
        armsChange: { $subtract: [{ $last: '$measurements.arms' }, { $first: '$measurements.arms' }] },
        currentThighs: { $last: '$measurements.thighs' },
        startingThighs: { $first: '$measurements.thighs' },
        thighsChange: { $subtract: [{ $last: '$measurements.thighs' }, { $first: '$measurements.thighs' }] }
      }
    }
  ]);
};

module.exports = mongoose.model('Progress', progressSchema);
