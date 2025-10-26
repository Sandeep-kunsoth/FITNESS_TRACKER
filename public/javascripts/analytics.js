// Analytics Page JavaScript
class AnalyticsPage {
  constructor() {
    this.token = localStorage.getItem('token');
    this.charts = {};
    this.currentPeriod = 'week';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadAnalyticsData();
  }

  setupEventListeners() {
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handlePeriodChange(e.target.dataset.period);
      });
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleTabChange(e.target.dataset.tab);
      });
    });

    // Export buttons
    document.getElementById('exportCSV')?.addEventListener('click', () => {
      this.exportData('csv');
    });

    document.getElementById('exportPDF')?.addEventListener('click', () => {
      this.exportData('pdf');
    });

    document.getElementById('exportJSON')?.addEventListener('click', () => {
      this.exportData('json');
    });
  }

  handlePeriodChange(period) {
    this.currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');

    // Reload data for new period
    this.loadAnalyticsData();
  }

  handleTabChange(tab) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Show corresponding tab panel
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
  }

  async loadAnalyticsData() {
    if (!this.token) {
      this.loadMockData();
      return;
    }

    try {
      // Load dashboard data for analytics
      const response = await fetch(`/api/dashboard/stats?period=${this.currentPeriod}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updateMetrics(data.data);
        this.updateCharts(data.data);
      } else {
        this.loadMockData();
      }
    } catch (error) {
      console.error('Load analytics data error:', error);
      this.loadMockData();
    }
  }

  loadMockData() {
    // Mock data for demonstration
    const mockData = {
      workouts: {
        totalWorkouts: 12,
        totalDuration: 540,
        totalCalories: 2400,
        averageDuration: 45,
        averageCalories: 200
      },
      meals: {
        totalMeals: 21,
        totalCalories: 15750,
        totalProtein: 315,
        totalCarbs: 1575,
        totalFat: 525,
        averageCalories: 750
      },
      sleep: {
        totalSleepRecords: 7,
        totalSleepTime: 3150,
        averageDuration: 450,
        averageQuality: 75
      },
      progress: {
        totalEntries: 3,
        currentWeight: 75,
        startingWeight: 78,
        weightChange: -3,
        averageWeight: 76.5
      }
    };

    this.updateMetrics(mockData);
    this.updateCharts(mockData);
  }

  updateMetrics(data) {
    document.getElementById('totalCaloriesBurned').textContent = data.workouts?.totalCalories || 0;
    document.getElementById('totalWorkoutTime').textContent = `${Math.round((data.workouts?.totalDuration || 0) / 60)} hrs`;
    document.getElementById('totalWorkouts').textContent = data.workouts?.totalWorkouts || 0;
    document.getElementById('weightChange').textContent = `${data.progress?.weightChange || 0} kg`;
  }

  updateCharts(data) {
    this.createWorkoutActivityChart();
    this.createExerciseTypeChart();
    this.createCalorieBalanceChart();
    this.createWeightProgressChart();
  }

  createWorkoutActivityChart() {
    const ctx = document.getElementById('workoutActivityChart');
    if (!ctx) return;

    if (this.charts.workoutActivity) {
      this.charts.workoutActivity.destroy();
    }

    // Mock data for workout activity
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const workoutData = [45, 60, 30, 75, 90, 45, 30];

    this.charts.workoutActivity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Workout Duration (min)',
          data: workoutData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createExerciseTypeChart() {
    const ctx = document.getElementById('exerciseTypeChart');
    if (!ctx) return;

    if (this.charts.exerciseType) {
      this.charts.exerciseType.destroy();
    }

    // Mock data for exercise types
    const exerciseData = {
      labels: ['Running', 'Cycling', 'Weightlifting', 'Yoga', 'Swimming'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#f5576c',
          '#4facfe'
        ]
      }]
    };

    this.charts.exerciseType = new Chart(ctx, {
      type: 'doughnut',
      data: exerciseData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  createCalorieBalanceChart() {
    const ctx = document.getElementById('calorieBalanceChart');
    if (!ctx) return;

    if (this.charts.calorieBalance) {
      this.charts.calorieBalance.destroy();
    }

    // Mock data for calorie balance
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const intakeData = [2200, 2100, 2300, 2000, 2400, 2500, 2200];
    const burnedData = [300, 400, 200, 500, 600, 300, 200];

    this.charts.calorieBalance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Calories Consumed',
            data: intakeData,
            backgroundColor: 'rgba(78, 205, 196, 0.8)',
            borderColor: '#4ecdc4',
            borderWidth: 1
          },
          {
            label: 'Calories Burned',
            data: burnedData,
            backgroundColor: 'rgba(255, 107, 107, 0.8)',
            borderColor: '#ff6b6b',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createWeightProgressChart() {
    const ctx = document.getElementById('weightProgressChart');
    if (!ctx) return;

    if (this.charts.weightProgress) {
      this.charts.weightProgress.destroy();
    }

    // Mock data for weight progress
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weightData = [78, 77.5, 76.8, 75.2];

    this.charts.weightProgress = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weight (kg)',
          data: weightData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            min: 70,
            max: 80
          }
        }
      }
    });
  }

  exportData(format) {
    // Mock export functionality
    const data = {
      period: this.currentPeriod,
      timestamp: new Date().toISOString(),
      workouts: {
        total: 12,
        duration: 540,
        calories: 2400
      },
      nutrition: {
        totalCalories: 15750,
        protein: 315,
        carbs: 1575,
        fat: 525
      },
      sleep: {
        averageDuration: 450,
        averageQuality: 75
      },
      progress: {
        weightChange: -3,
        bmiChange: -0.8
      }
    };

    let filename, content, mimeType;

    switch (format) {
      case 'csv':
        filename = `fitness_analytics_${this.currentPeriod}.csv`;
        content = this.convertToCSV(data);
        mimeType = 'text/csv';
        break;
      case 'json':
        filename = `fitness_analytics_${this.currentPeriod}.json`;
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'pdf':
        filename = `fitness_analytics_${this.currentPeriod}.pdf`;
        content = 'PDF export would be implemented here';
        mimeType = 'application/pdf';
        break;
    }

    this.downloadFile(filename, content, mimeType);
    this.showSuccess(`Data exported as ${format.toUpperCase()}`);
  }

  convertToCSV(data) {
    const rows = [];
    rows.push(['Metric', 'Value']);
    rows.push(['Period', data.period]);
    rows.push(['Total Workouts', data.workouts.total]);
    rows.push(['Total Duration (min)', data.workouts.duration]);
    rows.push(['Total Calories Burned', data.workouts.calories]);
    rows.push(['Total Calories Consumed', data.nutrition.totalCalories]);
    rows.push(['Average Sleep Duration (min)', data.sleep.averageDuration]);
    rows.push(['Weight Change (kg)', data.progress.weightChange]);
    
    return rows.map(row => row.join(',')).join('\n');
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  new AnalyticsPage();
});
