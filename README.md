# Klinik Kenanga API Server

A simple Express API server for booking appointments at Klinik Kenanga. This server uses the proven `quickReg.js` script to handle appointment submissions.

## Features

- ✅ Appointment booking via POST `/api/book-appointment`
- ✅ Health check endpoint at `/health`
- ✅ CORS enabled for cross-origin requests
- ✅ Input validation
- ✅ Error handling
- ✅ Static data endpoints for doctors and time slots

## Local Development

1. Install dependencies:
```bash
cd api
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### Book Appointment
```
POST /api/book-appointment
Content-Type: application/json

{
  "name": "John Doe",
  "nric": "123456789012",
  "tel": "0123456789",
  "dob": "01/01/1990",
  "sex": "m",
  "email": "john@example.com",
  "alamat": "123 Main St",
  "doctor": "Bryan",
  "time": "9:00 AM",
  "date": "15/12/2024"
}
```

### Get Doctors
```
GET /api/doctors
```

### Get Time Slots
```
GET /api/time-slots
```

## Deployment to Heroku

### Method 1: Heroku CLI

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create a new Heroku app:
```bash
cd api
heroku create klinik-kenanga-api
```

3. Deploy:
```bash
git add .
git commit -m "Deploy API server"
git push heroku main
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Heroku
3. Enable automatic deploys from the main branch

### Method 3: Heroku Dashboard

1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Click "New" → "Create new app"
3. Choose your app name and region
4. Connect to your GitHub repository
5. Deploy the `api` directory

## Environment Variables

The server uses these environment variables:
- `PORT`: Port number (Heroku sets this automatically)

## Testing the API

Once deployed, test the health endpoint:
```bash
curl https://your-app-name.herokuapp.com/health
```

## React App Integration

Update your React app's API client to use the deployed URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app-name.herokuapp.com';
```

## Troubleshooting

- Check Heroku logs: `heroku logs --tail`
- Ensure all dependencies are in `package.json`
- Verify the `Procfile` is in the correct location
- Make sure Node.js version is compatible (>=18.0.0) 