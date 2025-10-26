const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify your gender']
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age must be less than 120']
  },
  weight: {
    type: Number,
    required: [true, 'Please provide your weight'],
    min: [20, 'Weight must be at least 20 kg'],
    max: [300, 'Weight must be less than 300 kg']
  },
  height: {
    type: Number,
    required: [true, 'Please provide your height'],
    min: [100, 'Height must be at least 100 cm'],
    max: [250, 'Height must be less than 250 cm']
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    default: 'moderately_active'
  },
  goal: {
    type: String,
    enum: ['lose_weight', 'maintain_weight', 'gain_weight'],
    default: 'maintain_weight'
  },
  targetWeight: {
    type: Number,
    min: [20, 'Target weight must be at least 20 kg'],
    max: [300, 'Target weight must be less than 300 kg']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate BMI
userSchema.methods.calculateBMI = function() {
  const heightInMeters = this.height / 100;
  return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
};

// Calculate BMR (Basal Metabolic Rate)
userSchema.methods.calculateBMR = function() {
  let bmr;
  if (this.gender === 'male') {
    bmr = 88.362 + (13.397 * this.weight) + (4.799 * this.height) - (5.677 * this.age);
  } else {
    bmr = 447.593 + (9.247 * this.weight) + (3.098 * this.height) - (4.330 * this.age);
  }
  return Math.round(bmr);
};

// Calculate daily calorie needs
userSchema.methods.calculateDailyCalories = function() {
  const bmr = this.calculateBMR();
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  return Math.round(bmr * activityMultipliers[this.activityLevel]);
};

module.exports = mongoose.model('User', userSchema);
