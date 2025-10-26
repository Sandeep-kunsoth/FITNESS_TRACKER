# Environment Variables Configuration

## Required Environment Variables for Production

### Database
- `MONGODB_URI`: MongoDB connection string
  - Development: `mongodb://localhost:27017/fitness_tracker`
  - Production: MongoDB Atlas or Render MongoDB service URI

### Server
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Authentication
- `JWT_SECRET`: Secret key for JWT token signing

## Render Deployment Setup

1. **Create MongoDB Service on Render:**
   - Go to Render Dashboard
   - Click "New +" → "MongoDB"
   - Choose plan and region
   - Note the connection string

2. **Set Environment Variables in Render:**
   - Go to your web service settings
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB connection string from step 1
     - `NODE_ENV`: production
     - `JWT_SECRET`: A secure random string

3. **Deploy:**
   - Connect your GitHub repository
   - Render will automatically deploy when you push changes
