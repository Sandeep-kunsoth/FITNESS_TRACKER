// Fitness Page JavaScript
class FitnessPage {
  constructor() {
    this.token = localStorage.getItem('token');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupExerciseTypeIntensityMapping();
    this.setupDatePicker();
    this.loadWorkoutData();
  }

  setupEventListeners() {
    // Quick workout form
    document.getElementById('quickWorkoutForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleQuickWorkout();
    });

    // Exercise type change
    document.getElementById('exerciseType')?.addEventListener('change', (e) => {
      this.updateIntensityOptions(e.target.value);
    });

    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleSuggestionClick(e.target.closest('.suggestion-card'));
      });
    });
  }

  setupExerciseTypeIntensityMapping() {
    this.exerciseIntensities = {
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
  }

  setupDatePicker() {
    const datePicker = document.getElementById('workoutDate');
    if (datePicker) {
      datePicker.value = new Date().toISOString().split('T')[0];
    }
  }

  updateIntensityOptions(exerciseType) {
    const intensitySelect = document.getElementById('intensity');
    if (!intensitySelect) return;

    intensitySelect.innerHTML = '<option value="">Select Intensity</option>';
    
    if (this.exerciseIntensities[exerciseType]) {
      this.exerciseIntensities[exerciseType].forEach(intensity => {
        const option = document.createElement('option');
        option.value = intensity;
        option.textContent = intensity;
        intensitySelect.appendChild(option);
      });
    }
  }

  async handleQuickWorkout() {
    if (!this.token) {
      this.showError('Please login to add workouts');
      return;
    }

    const formData = {
      exerciseType: document.getElementById('exerciseType').value,
      intensity: document.getElementById('intensity').value,
      duration: parseInt(document.getElementById('duration').value),
      date: document.getElementById('workoutDate').value,
      notes: document.getElementById('workoutNotes').value
    };

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        this.showSuccess('Workout added successfully!');
        document.getElementById('quickWorkoutForm').reset();
        this.setupDatePicker();
        this.loadWorkoutData();
      } else {
        this.showError(data.message || 'Failed to add workout');
      }
    } catch (error) {
      console.error('Add workout error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  handleSuggestionClick(card) {
    const exercise = card.dataset.exercise;
    const exerciseSelect = document.getElementById('exerciseType');
    const intensitySelect = document.getElementById('intensity');
    const durationInput = document.getElementById('duration');

    if (exerciseSelect) {
      exerciseSelect.value = exercise;
      this.updateIntensityOptions(exercise);
    }

    // Set default values based on suggestion
    const suggestions = {
      running: { intensity: 'moderate', duration: 30 },
      yoga: { intensity: 'hatha', duration: 45 },
      weightlifting: { intensity: 'moderate', duration: 60 },
      cycling: { intensity: 'moderate', duration: 45 },
      swimming: { intensity: 'moderate', duration: 40 },
      hiking: { intensity: 'moderate', duration: 90 }
    };

    const suggestion = suggestions[exercise];
    if (suggestion) {
      setTimeout(() => {
        if (intensitySelect) intensitySelect.value = suggestion.intensity;
        if (durationInput) durationInput.value = suggestion.duration;
      }, 100);
    }

    this.showSuccess('Suggestion applied to form!');
  }

  async loadWorkoutData() {
    if (!this.token) return;

    try {
      // Load recent workouts
      const workoutsResponse = await fetch('/api/workouts?limit=5', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json();
        this.updateRecentWorkouts(workoutsData.data);
      }

      // Load workout statistics
      const statsResponse = await fetch('/api/workouts/stats/summary?period=week', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        this.updateWorkoutStats(statsData.data.summary);
      }
    } catch (error) {
      console.error('Load workout data error:', error);
    }
  }

  updateRecentWorkouts(workouts) {
    const container = document.getElementById('recentWorkoutsList');
    if (!container) return;

    if (workouts.length === 0) {
      container.innerHTML = '<p class="text-center">No recent workouts found</p>';
      return;
    }

    container.innerHTML = workouts.map(workout => `
      <div class="workout-item">
        <div class="workout-info">
          <h4>${workout.exerciseType.charAt(0).toUpperCase() + workout.exerciseType.slice(1)}</h4>
          <p>${workout.intensity} intensity • ${new Date(workout.date).toLocaleDateString()}</p>
        </div>
        <div class="workout-meta">
          <div>${workout.duration} min</div>
          <div>${workout.caloriesBurned} cal</div>
        </div>
      </div>
    `).join('');
  }

  updateWorkoutStats(stats) {
    document.getElementById('weeklyCalories').textContent = stats.totalCaloriesBurned || 0;
    document.getElementById('weeklyDuration').textContent = `${stats.totalDuration || 0} min`;
    document.getElementById('weeklyWorkouts').textContent = stats.totalWorkouts || 0;
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 2rem;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;

    if (type === 'error') {
      notification.style.backgroundColor = '#dc3545';
    } else {
      notification.style.backgroundColor = '#28a745';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FitnessPage();
});
