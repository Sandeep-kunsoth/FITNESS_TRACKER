# Configuration Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

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

# Optional: External API Keys (for nutrition data)
# NUTRITION_API_KEY=your_nutrition_api_key_here
# NUTRITION_APP_ID=your_nutrition_app_id_here
```

## MongoDB Setup

1. Install MongoDB on your system
2. Start MongoDB service
3. The application will automatically create the database and collections

## Security Notes

- Change the JWT_SECRET to a strong, random string in production
- Use environment variables for all sensitive configuration
- Ensure MongoDB is properly secured in production

## Development vs Production

### Development
- Uses local MongoDB instance
- Detailed error logging
- Hot reload with nodemon

### Production
- Use production MongoDB instance
- Set NODE_ENV=production
- Use strong JWT secrets
- Enable proper logging and monitoring
