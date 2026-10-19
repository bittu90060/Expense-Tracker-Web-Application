# Pocketwise Expense Tracker

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Create `frontend/.env` if needed:
```env
VITE_API_URL=http://localhost:5000/api
```

## Backend
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
Run `npm run dev`. MongoDB must be running locally, or use your MongoDB Atlas URI.

Never commit `.env` or real secrets to GitHub.
