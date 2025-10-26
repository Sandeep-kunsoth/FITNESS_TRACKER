const mongoose = require('mongoose');

const sleepSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sleepStart: {
    type: Date,
    required: [true, 'Please provide sleep start time']
  },
  sleepEnd: {
    type: Date,
    required: [true, 'Please provide sleep end time']
  },
  date: {
    type: Date,
    required: [true, 'Please provide the sleep date'],
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  quality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    default: 'good'
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

// Calculate duration before saving
sleepSchema.pre('save', function(next) {
  if (this.sleepStart && this.sleepEnd) {
    this.calculateDuration();
  }
  next();
});

// Method to calculate sleep duration
sleepSchema.methods.calculateDuration = function() {
  if (!this.sleepStart || !this.sleepEnd) {
    return 0;
  }

  const startTime = new Date(this.sleepStart);
  const endTime = new Date(this.sleepEnd);
  
  // Handle case where sleep crosses midnight
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  const durationMs = endTime.getTime() - startTime.getTime();
  this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  
  return this.duration;
};

// Method to get sleep quality score (0-100)
sleepSchema.methods.getQualityScore = function() {
  const qualityScores = {
    poor: 25,
    fair: 50,
    good: 75,
    excellent: 100
  };
  return qualityScores[this.quality] || 75;
};

// Method to check if sleep duration is healthy
sleepSchema.methods.isHealthyDuration = function() {
  const hours = this.duration / 60;
  return hours >= 7 && hours <= 9; // Recommended 7-9 hours
};

// Static method to get weekly sleep summary
sleepSchema.statics.getWeeklySummary = function(userId, startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: null,
        averageDuration: { $avg: '$duration' },
        totalSleepTime: { $sum: '$duration' },
        sleepDays: { $sum: 1 },
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
};

// Static method to get sleep trends
sleepSchema.statics.getSleepTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    date: { $gte: startDate }
  })
  .sort({ date: 1 })
  .select('date duration quality');
};

module.exports = mongoose.model('Sleep', sleepSchema);
