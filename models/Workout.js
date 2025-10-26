const mongoose = require('mongoose');

// MET values for different exercises (Metabolic Equivalent of Task)
const MET_VALUES = {
  running: { '5 mph': 8.3, '6 mph': 9.8, '7 mph': 11.0, '8 mph': 11.8, '9 mph': 12.8, '10 mph': 14.5 },
  cycling: { 'leisurely': 3.5, 'moderate': 6.8, 'vigorous': 10.0, 'racing': 15.8 },
  swimming: { 'leisurely': 5.8, 'moderate': 7.0, 'vigorous': 9.8 },
  yoga: { 'hatha': 2.5, 'power': 4.0, 'vinyasa': 3.0 },
  weightlifting: { 'light': 3.0, 'moderate': 5.0, 'vigorous': 6.0 },
  walking: { 'slow': 2.0, 'moderate': 3.5, 'brisk': 4.3, 'very_brisk': 5.0 },
  dancing: { 'slow': 3.0, 'moderate': 4.8, 'fast': 5.5 },
  basketball: { 'casual': 6.0, 'competitive': 8.0 },
  soccer: { 'casual': 7.0, 'competitive': 10.0 },
  tennis: { 'singles': 8.0, 'doubles': 5.0 },
  hiking: { 'easy': 4.0, 'moderate': 6.0, 'strenuous': 8.0 }
};

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  exerciseType: {
    type: String,
    required: [true, 'Please specify the exercise type'],
    enum: Object.keys(MET_VALUES)
  },
  intensity: {
    type: String,
    required: [true, 'Please specify the intensity level']
  },
  duration: {
    type: Number,
    required: [true, 'Please provide workout duration in minutes'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  date: {
    type: Date,
    required: [true, 'Please provide the workout date'],
    default: Date.now
  },
  caloriesBurned: {
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

// Calculate calories burned before saving
workoutSchema.pre('save', function(next) {
  if (this.isModified('exerciseType') || this.isModified('intensity') || this.isModified('duration')) {
    this.calculateCaloriesBurned();
  }
  next();
});

// Method to calculate calories burned
workoutSchema.methods.calculateCaloriesBurned = function() {
  return new Promise((resolve, reject) => {
    this.populate('user')
      .then(workout => {
        if (!workout.user) {
          reject(new Error('User not found'));
          return;
        }

        const metValue = MET_VALUES[this.exerciseType]?.[this.intensity];
        if (!metValue) {
          reject(new Error('Invalid exercise type or intensity'));
          return;
        }

        // Calories = MET × weight(kg) × time(hours)
        const timeInHours = this.duration / 60;
        const calories = metValue * workout.user.weight * timeInHours;
        
        this.caloriesBurned = Math.round(calories);
        resolve(this.caloriesBurned);
      })
      .catch(reject);
  });
};

// Static method to get available intensities for an exercise type
workoutSchema.statics.getIntensities = function(exerciseType) {
  return MET_VALUES[exerciseType] ? Object.keys(MET_VALUES[exerciseType]) : [];
};

// Static method to get MET value
workoutSchema.statics.getMETValue = function(exerciseType, intensity) {
  return MET_VALUES[exerciseType]?.[intensity] || 0;
};

module.exports = mongoose.model('Workout', workoutSchema);
