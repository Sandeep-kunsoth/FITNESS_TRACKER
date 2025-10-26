// Fitness Tracker Frontend Application
class FitnessTracker {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = null;
    this.charts = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
    this.setupDatePicker();
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => this.showAuthModal('login'));
    document.getElementById('signupBtn')?.addEventListener('click', () => this.showAuthModal('signup'));
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

    // Modal close
    document.querySelector('.close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('authModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'authModal') this.closeModal();
    });

    // Date picker
    document.getElementById('datePicker')?.addEventListener('change', (e) => {
      this.loadDashboardData(e.target.value);
    });
  }

  setupDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
      datePicker.value = new Date().toISOString().split('T')[0];
    }
  }

  checkAuthStatus() {
    if (this.token) {
      this.getCurrentUser();
    } else {
      this.showWelcomeSection();
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.showDashboard();
        this.loadDashboardData();
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      this.logout();
    }
  }

  showWelcomeSection() {
    document.getElementById('welcomeSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('signupBtn').style.display = 'inline-block';
    document.getElementById('userMenu').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('signupBtn').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = this.user.name;
  }

  showAuthModal(type) {
    const modal = document.getElementById('authModal');
    const content = document.getElementById('authContent');
    
    if (type === 'login') {
      content.innerHTML = this.getLoginForm();
    } else {
      content.innerHTML = this.getSignupForm();
    }
    
    modal.style.display = 'block';
    this.setupAuthForm(type);
  }

  closeModal() {
    document.getElementById('authModal').style.display = 'none';
  }

  getLoginForm() {
    return `
      <h2>Login</h2>
      <form id="loginForm">
        <div class="form-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" required>
        </div>
        <div class="form-group">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" required>
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
      </form>
      <p class="text-center mt-2">
        Don't have an account? <a href="#" id="switchToSignup">Sign up</a>
      </p>
    `;
  }

  getSignupForm() {
    return `
      <h2>Sign Up</h2>
      <form id="signupForm">
        <div class="form-group">
          <label for="signupName">Full Name</label>
          <input type="text" id="signupName" required>
        </div>
        <div class="form-group">
          <label for="signupEmail">Email</label>
          <input type="email" id="signupEmail" required>
        </div>
        <div class="form-group">
          <label for="signupPassword">Password</label>
          <input type="password" id="signupPassword" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="signupGender">Gender</label>
            <select id="signupGender" required>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="signupAge">Age</label>
            <input type="number" id="signupAge" min="13" max="120" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="signupWeight">Weight (kg)</label>
            <input type="number" id="signupWeight" step="0.1" min="20" max="300" required>
          </div>
          <div class="form-group">
            <label for="signupHeight">Height (cm)</label>
            <input type="number" id="signupHeight" min="100" max="250" required>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Sign Up</button>
      </form>
      <p class="text-center mt-2">
        Already have an account? <a href="#" id="switchToLogin">Login</a>
      </p>
    `;
  }

  setupAuthForm(type) {
    const form = document.getElementById(type + 'Form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (type === 'login') {
          this.handleLogin();
        } else {
          this.handleSignup();
        }
      });
    }

    // Switch between login and signup
    const switchLink = document.getElementById('switchTo' + (type === 'login' ? 'Signup' : 'Login'));
    if (switchLink) {
      switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAuthModal(type === 'login' ? 'signup' : 'login');
      });
    }
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', this.token);
        this.closeModal();
        this.showDashboard();
        this.loadDashboardData();
        this.showSuccess('Login successful!');
      } else {
        this.showError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  async handleSignup() {
    const formData = {
      name: document.getElementById('signupName').value,
      email: document.getElementById('signupEmail').value,
      password: document.getElementById('signupPassword').value,
      gender: document.getElementById('signupGender').value,
      age: parseInt(document.getElementById('signupAge').value),
      weight: parseFloat(document.getElementById('signupWeight').value),
      height: parseInt(document.getElementById('signupHeight').value)
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', this.token);
        this.closeModal();
        this.showDashboard();
        this.loadDashboardData();
        this.showSuccess('Account created successfully!');
      } else {
        this.showError(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    this.showWelcomeSection();
    this.showSuccess('Logged out successfully');
  }

  async loadDashboardData(date = null) {
    if (!this.token) return;

    try {
      const url = date ? `/api/dashboard?date=${date}` : '/api/dashboard';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updateDashboard(data.data);
      } else {
        this.showError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      this.showError('Network error loading dashboard');
    }
  }

  updateDashboard(data) {
    // Update stats cards
    document.getElementById('caloriesBurned').textContent = data.daily.summary.workouts.totalCalories;
    document.getElementById('caloriesConsumed').textContent = data.daily.summary.meals.totalCalories;
    document.getElementById('workoutTime').textContent = data.daily.summary.workouts.totalDuration + ' min';
    document.getElementById('sleepTime').textContent = Math.round(data.daily.summary.sleep.totalDuration / 60) + ' hrs';

    // Update charts
    this.updateWeightChart(data.charts.weightTrend);
    this.updateCalorieChart(data.charts.weeklyCalories);

    // Update recent activities
    this.updateRecentWorkouts(data.daily.workouts);
    this.updateRecentMeals(data.daily.meals);
  }

  updateWeightChart(weightData) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    if (this.charts.weight) {
      this.charts.weight.destroy();
    }

    this.charts.weight = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weightData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Weight (kg)',
          data: weightData.map(d => d.weight),
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
            beginAtZero: false
          }
        }
      }
    });
  }

  updateCalorieChart(calorieData) {
    const ctx = document.getElementById('calorieChart');
    if (!ctx) return;

    if (this.charts.calorie) {
      this.charts.calorie.destroy();
    }

    this.charts.calorie = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: calorieData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Calories Consumed',
            data: calorieData.map(d => d.intake),
            backgroundColor: 'rgba(78, 205, 196, 0.8)',
            borderColor: '#4ecdc4',
            borderWidth: 1
          },
          {
            label: 'Calories Burned',
            data: calorieData.map(d => d.burned),
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

  updateRecentWorkouts(workouts) {
    const container = document.getElementById('recentWorkouts');
    if (!container) return;

    if (workouts.length === 0) {
      container.innerHTML = '<p class="text-center">No workouts today</p>';
      return;
    }

    container.innerHTML = workouts.slice(0, 5).map(workout => `
      <div class="activity-item">
        <div class="activity-info">
          <h4>${workout.exerciseType.charAt(0).toUpperCase() + workout.exerciseType.slice(1)}</h4>
          <p>${workout.intensity} intensity</p>
        </div>
        <div class="activity-meta">
          <div>${workout.duration} min</div>
          <div>${workout.caloriesBurned} cal</div>
        </div>
      </div>
    `).join('');
  }

  updateRecentMeals(meals) {
    const container = document.getElementById('recentMeals');
    if (!container) return;

    if (meals.length === 0) {
      container.innerHTML = '<p class="text-center">No meals logged today</p>';
      return;
    }

    container.innerHTML = meals.slice(0, 5).map(meal => `
      <div class="activity-item">
        <div class="activity-info">
          <h4>${meal.name}</h4>
          <p>${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}</p>
        </div>
        <div class="activity-meta">
          <div>${Math.round(meal.totalCalories)} cal</div>
          <div>${meal.foods.length} items</div>
        </div>
      </div>
    `).join('');
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new FitnessTracker();
});
