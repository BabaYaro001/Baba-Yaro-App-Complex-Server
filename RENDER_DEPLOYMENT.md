# Render Deployment Guide

## Step 1: Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `babayaro-app-backend` (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Region**: Select your preferred region

6. Add Environment Variables:
   - Go to "Environment" section
   - Add:
     - `REMOVE_BG_API_KEY`: `tP44LzdZtWF99ZnpLt2cQSNB`
     - `FRONTEND_URL`: `https://your-frontend-url.onrender.com` (add this after deploying frontend)

7. Deploy and note your backend URL (e.g., `https://babayaro-app-backend.onrender.com`)

---

## Step 2: Deploy Frontend to Render

1. Create a new Web Service (same process as backend)
2. Configure the service:
   - **Name**: `babayaro-app-frontend` (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run server` (if you want to run backend from frontend, or use a simple static server)
   
   **For production, use a static server**:
   - **Build Command**: `npm run build`
   - **Publish directory**: `build`

3. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://your-backend-app.onrender.com` (the URL from Step 1)

4. Deploy and note your frontend URL

---

## Step 3: Update Backend CORS

Go back to your backend service on Render and update the `FRONTEND_URL` environment variable with your frontend URL (from Step 2).

---

## Local Development

To test locally before deploying:

```bash
# Terminal 1 - Backend
cd d:\babayaroappcomplex
npm run server

# Terminal 2 - Frontend
cd d:\babayaroappcomplex
npm start
```

The frontend will automatically use `http://localhost:5000` as the API URL (from `.env.frontend.example`).

---

## Troubleshooting

- **CORS errors**: Make sure `FRONTEND_URL` is set correctly in backend environment variables
- **API not responding**: Check that both services are running and the `REACT_APP_API_URL` matches your backend URL
- **Remove.bg API errors**: Verify `REMOVE_BG_API_KEY` is set in backend environment variables
