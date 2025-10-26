// Goals Page JavaScript
class GoalsPage {
  constructor() {
    this.token = localStorage.getItem('token');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadGoalsData();
    this.setupDailyQuote();
  }

  setupEventListeners() {
    // Goal form
    document.getElementById('goalForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGoalSubmission();
    });

    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleTemplateClick(e.target.closest('.template-card'));
      });
    });

    // Goal type change
    document.getElementById('goalType')?.addEventListener('change', (e) => {
      this.updateUnitOptions(e.target.value);
    });
  }

  setupDailyQuote() {
    const quotes = [
      "The only bad workout is the one that didn't happen.",
      "Your body can do it. It's your mind that you have to convince.",
      "The pain you feel today will be the strength you feel tomorrow.",
      "Don't wish for it, work for it.",
      "Success isn't always about greatness. It's about consistency.",
      "The groundwork for all happiness is good health.",
      "Take care of your body. It's the only place you have to live.",
      "Fitness is not about being better than someone else. It's about being better than you used to be."
    ];

    const dailyQuote = document.getElementById('dailyQuote');
    if (dailyQuote) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      dailyQuote.textContent = `"${randomQuote}"`;
    }
  }

  updateUnitOptions(goalType) {
    const unitSelect = document.getElementById('goalUnit');
    if (!unitSelect) return;

    unitSelect.innerHTML = '<option value="">Select Unit</option>';

    const unitMappings = {
      weight: ['kg', 'lbs'],
      calories: ['calories'],
      workout_time: ['minutes', 'hours'],
      sleep: ['hours'],
      steps: ['steps'],
      water: ['liters', 'cups']
    };

    if (unitMappings[goalType]) {
      unitMappings[goalType].forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);
      });
    }
  }

  async handleGoalSubmission() {
    if (!this.token) {
      this.showError('Please login to set goals');
      return;
    }

    const formData = {
      type: document.getElementById('goalType').value,
      target: parseFloat(document.getElementById('goalTarget').value),
      unit: document.getElementById('goalUnit').value,
      deadline: document.getElementById('goalDeadline').value,
      description: document.getElementById('goalDescription').value
    };

    try {
      // For now, we'll simulate goal creation since we don't have a goals API yet
      this.showSuccess('Goal set successfully!');
      document.getElementById('goalForm').reset();
      this.loadGoalsData();
    } catch (error) {
      console.error('Set goal error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  handleTemplateClick(card) {
    const goalType = card.dataset.goal;
    const goalTypeSelect = document.getElementById('goalType');
    const goalTargetInput = document.getElementById('goalTarget');
    const goalUnitSelect = document.getElementById('goalUnit');
    const goalDeadlineInput = document.getElementById('goalDeadline');
    const goalDescriptionInput = document.getElementById('goalDescription');

    const templates = {
      weight_loss: {
        type: 'weight',
        target: 5,
        unit: 'kg',
        deadline: this.getDateInMonths(3),
        description: 'Lose 1-2 kg per month through consistent exercise and healthy eating'
      },
      muscle_gain: {
        type: 'workout_time',
        target: 180,
        unit: 'minutes',
        deadline: this.getDateInMonths(6),
        description: 'Strength training 3 times per week for muscle building'
      },
      cardio_fitness: {
        type: 'workout_time',
        target: 30,
        unit: 'minutes',
        deadline: this.getDateInMonths(2),
        description: 'Daily cardio exercise to improve cardiovascular fitness'
      },
      flexibility: {
        type: 'workout_time',
        target: 20,
        unit: 'minutes',
        deadline: this.getDateInMonths(1),
        description: 'Daily stretching routine to improve flexibility and mobility'
      }
    };

    const template = templates[goalType];
    if (template) {
      if (goalTypeSelect) goalTypeSelect.value = template.type;
      this.updateUnitOptions(template.type);
      
      setTimeout(() => {
        if (goalTargetInput) goalTargetInput.value = template.target;
        if (goalUnitSelect) goalUnitSelect.value = template.unit;
        if (goalDeadlineInput) goalDeadlineInput.value = template.deadline;
        if (goalDescriptionInput) goalDescriptionInput.value = template.description;
      }, 100);
    }

    this.showSuccess('Template applied to form!');
  }

  getDateInMonths(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  }

  async loadGoalsData() {
    if (!this.token) return;

    try {
      // For now, we'll use mock data since we don't have a goals API yet
      this.updateGoalProgress();
      this.updateGoalHistory();
    } catch (error) {
      console.error('Load goals data error:', error);
    }
  }

  updateGoalProgress() {
    // Update progress bars with animation
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = width;
      }, 500);
    });
  }

  updateGoalHistory() {
    const container = document.getElementById('goalHistoryList');
    if (!container) return;

    const mockHistory = [
      {
        type: 'Weight Loss',
        target: 'Lose 5kg',
        status: 'completed',
        date: '2024-01-15',
        progress: 100
      },
      {
        type: 'Cardio Fitness',
        target: '30 min daily',
        status: 'in_progress',
        date: '2024-02-01',
        progress: 75
      },
      {
        type: 'Muscle Building',
        target: '3x per week',
        status: 'in_progress',
        date: '2024-02-10',
        progress: 60
      }
    ];

    container.innerHTML = mockHistory.map(goal => `
      <div class="goal-history-item">
        <div class="goal-info">
          <h4>${goal.type}</h4>
          <p>${goal.target}</p>
          <span class="goal-date">Started: ${new Date(goal.date).toLocaleDateString()}</span>
        </div>
        <div class="goal-status">
          <div class="status-badge ${goal.status}">${goal.status.replace('_', ' ')}</div>
          <div class="progress-percentage">${goal.progress}%</div>
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GoalsPage();
});
