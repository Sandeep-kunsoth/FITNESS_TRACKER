# Fitness Tracker - MEAN Stack Application

A comprehensive fitness tracking application built with the MEAN stack (MongoDB, Express.js, Angular/Node.js, Node.js) that helps users track their workouts, nutrition, sleep, and progress towards their fitness goals.

## 🚀 Features

### ✅ User Authentication
- **JWT-based Authentication**: Secure signup, login, and logout
- **Profile Management**: Complete user profiles with personal information
- **Password Security**: Bcrypt hashing for secure password storage

### ✅ Dashboard
- **Daily Summary**: Overview of calories burned, workout duration, steps, and more
- **Progress Charts**: Interactive charts using Chart.js for data visualization
- **Real-time Updates**: Live data updates and statistics

### ✅ Workout Tracker
- **CRUD Operations**: Add, edit, delete, and view workouts
- **Exercise Types**: Support for running, yoga, cycling, weightlifting, and more
- **MET-based Calculations**: Automatic calorie burn calculations using Metabolic Equivalent of Task values
- **Duration Tracking**: Track workout duration and intensity levels

### ✅ Nutrition Tracker
- **Meal Logging**: Log daily meals with detailed food information
- **Macronutrient Tracking**: Track calories, protein, carbs, and fat
- **Food Database**: Built-in common foods database with nutritional information
- **Daily Nutrition Summary**: Comprehensive daily nutrition overview

### ✅ Sleep Tracker
- **Sleep Logging**: Record sleep start and end times
- **Duration Calculation**: Automatic sleep duration calculation
- **Quality Assessment**: Track sleep quality (poor, fair, good, excellent)
- **Sleep Analytics**: Weekly and monthly sleep pattern analysis

### ✅ Progress Tracker
- **Weight Tracking**: Monitor weight changes over time
- **BMI Calculator**: Automatic BMI calculation and categorization
- **Body Measurements**: Track chest, waist, hips, arms, and thighs
- **Goal Tracking**: Set and monitor weight goals
- **Progress Visualization**: Charts and graphs for progress analysis

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcryptjs**: Password hashing
- **Express-validator**: Input validation

### Frontend
- **EJS**: Template engine
- **Chart.js**: Data visualization
- **Font Awesome**: Icons
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: Frontend functionality

### Development Tools
- **Nodemon**: Development server with auto-restart
- **CORS**: Cross-origin resource sharing
- **Morgan**: HTTP request logger

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitness_tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/fitness_tracker
   DB_NAME=fitness_tracker

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows
   net start MongoDB

   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Workouts
- `GET /api/workouts` - Get all workouts
- `GET /api/workouts/:id` - Get single workout
- `POST /api/workouts` - Create workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout
- `GET /api/workouts/stats/summary` - Get workout statistics
- `GET /api/workouts/exercise-types` - Get available exercise types

### Meals
- `GET /api/meals` - Get all meals
- `GET /api/meals/:id` - Get single meal
- `POST /api/meals` - Create meal
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal
- `GET /api/meals/nutrition/daily` - Get daily nutrition summary
- `GET /api/meals/nutrition/stats` - Get nutrition statistics
- `GET /api/meals/foods/common` - Get common foods database

### Sleep
- `GET /api/sleep` - Get all sleep records
- `GET /api/sleep/:id` - Get single sleep record
- `POST /api/sleep` - Create sleep record
- `PUT /api/sleep/:id` - Update sleep record
- `DELETE /api/sleep/:id` - Delete sleep record
- `GET /api/sleep/stats/summary` - Get sleep statistics
- `GET /api/sleep/stats/weekly` - Get weekly sleep summary
- `GET /api/sleep/trends` - Get sleep trends

### Progress
- `GET /api/progress` - Get all progress records
- `GET /api/progress/:id` - Get single progress record
- `POST /api/progress` - Create progress record
- `PUT /api/progress/:id` - Update progress record
- `DELETE /api/progress/:id` - Delete progress record
- `GET /api/progress/weight/trends` - Get weight progress
- `GET /api/progress/summary` - Get progress summary
- `GET /api/progress/measurements` - Get measurement progress
- `POST /api/progress/calculate-bmi` - Calculate BMI

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  gender: String (enum),
  age: Number,
  weight: Number,
  height: Number,
  activityLevel: String (enum),
  goal: String (enum),
  targetWeight: Number,
  createdAt: Date
}
```

### Workout Model
```javascript
{
  user: ObjectId (ref: User),
  exerciseType: String (enum),
  intensity: String,
  duration: Number,
  date: Date,
  caloriesBurned: Number,
  notes: String,
  createdAt: Date
}
```

### Meal Model
```javascript
{
  user: ObjectId (ref: User),
  name: String,
  mealType: String (enum),
  date: Date,
  foods: [{
    name: String,
    quantity: Number,
    unit: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFat: Number,
  notes: String,
  createdAt: Date
}
```

### Sleep Model
```javascript
{
  user: ObjectId (ref: User),
  sleepStart: Date,
  sleepEnd: Date,
  date: Date,
  duration: Number,
  quality: String (enum),
  notes: String,
  createdAt: Date
}
```

### Progress Model
```javascript
{
  user: ObjectId (ref: User),
  date: Date,
  weight: Number,
  bodyFat: Number,
  muscleMass: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  notes: String,
  createdAt: Date
}
```

## 🎨 Features in Detail

### MET Values for Exercise Types
The application includes comprehensive MET (Metabolic Equivalent of Task) values for various exercises:

- **Running**: 5 mph to 10 mph (8.3 - 14.5 MET)
- **Cycling**: Leisurely to racing (3.5 - 15.8 MET)
- **Swimming**: Leisurely to vigorous (5.8 - 9.8 MET)
- **Yoga**: Hatha to power (2.5 - 4.0 MET)
- **Weightlifting**: Light to vigorous (3.0 - 6.0 MET)
- **Walking**: Slow to very brisk (2.0 - 5.0 MET)
- And many more...

### BMI Categories
- **Underweight**: BMI < 18.5
- **Normal weight**: BMI 18.5 - 24.9
- **Overweight**: BMI 25.0 - 29.9
- **Obese**: BMI ≥ 30.0

### Sleep Quality Scoring
- **Poor**: 25 points
- **Fair**: 50 points
- **Good**: 75 points
- **Excellent**: 100 points

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Cross-origin resource sharing configuration
- **Environment Variables**: Sensitive data stored in environment variables

## 📱 Responsive Design

The application features a fully responsive design that works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🚀 Deployment

### Production Environment Variables
```env
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=production
```

### Deployment Steps
1. Set up a production MongoDB database
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start the application: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Social features and sharing
- [ ] Integration with fitness wearables
- [ ] Advanced analytics and insights
- [ ] Nutrition API integration
- [ ] Goal setting and achievement system
- [ ] Community features
- [ ] Export data functionality

---

**Built with ❤️ using the MEAN stack**
