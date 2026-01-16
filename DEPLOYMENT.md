# IronLord10 Deployment Guide

This guide will help you deploy the IronLord10 application to production.

## Architecture

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: FastAPI + Python (deployed on Render)
- **Database**: MongoDB (MongoDB Atlas recommended)

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A Render account (https://render.com)
3. A MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
4. An Odds API key (from your odds provider)

---

## Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with a username and password
4. Whitelist IP: `0.0.0.0/0` (allow access from anywhere)
5. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

---

## Part 2: Backend Deployment (Render)

### Step 1: Connect Repository to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: `Iron-Lord-10`

### Step 2: Configure Service

Use these settings:

- **Name**: `ironlord-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: Leave empty (render.yaml handles this)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables

Add these environment variables in Render:

- `ODDS_API_KEY`: Your odds API key
- `MONGO_URI`: Your MongoDB connection string from Part 1
- `CORS_ORIGIN`: `*` (temporarily, we'll update this after frontend deployment)
- `PORT`: `8000`
- `LOG_LEVEL`: `info`

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for the build to complete
3. Note your backend URL (e.g., `https://ironlord-backend.onrender.com`)

### Step 5: Test Backend

Visit: `https://your-backend-url.onrender.com/health`

You should see: `{"status": "healthy"}`

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Update API URL

1. Open `vercel.json`
2. Update the `destination` URL to match your Render backend URL:
   ```json
   "destination": "https://your-actual-backend.onrender.com/api/:path*"
   ```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables (Optional)

If you need to override the API URL:

- **Key**: `VITE_API_URL`
- **Value**: `https://your-backend.onrender.com`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://ironlord.vercel.app`)

---

## Part 4: Update CORS Settings

### Step 1: Update Backend CORS

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment"
4. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. Save and redeploy

### Step 2: Verify

1. Visit your Vercel frontend URL
2. Test the application
3. Check that API calls work correctly

---

## Part 5: Custom Domain (Optional)

### Frontend (Vercel)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Backend (Render)

1. Go to your service settings in Render
2. Click "Custom Domains"
3. Add your custom domain
4. Update DNS records as instructed

**Note**: If you add a custom domain to the frontend, remember to update the `CORS_ORIGIN` environment variable in Render!

---

## Troubleshooting

### Backend Issues

**Problem**: Build fails
- Check that all dependencies are in `requirements.txt`
- Verify Python version compatibility

**Problem**: Health check fails
- Ensure the `/health` endpoint is working
- Check logs in Render dashboard

**Problem**: Database connection errors
- Verify MongoDB connection string
- Check that IP whitelist includes `0.0.0.0/0`
- Ensure database user has proper permissions

### Frontend Issues

**Problem**: Build fails
- Run `npm install` locally to check for errors
- Verify all dependencies are in `package.json`

**Problem**: API calls fail
- Check that backend URL is correct in `vercel.json`
- Verify CORS settings in backend
- Check network tab in browser DevTools

**Problem**: 404 errors on page refresh
- This should be handled by Vercel automatically for SPAs
- Check that `vercel.json` is properly configured

---

## Environment Variables Summary

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `ODDS_API_KEY` | API key for odds service | `abc123...` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CORS_ORIGIN` | Allowed origin for CORS | `https://app.vercel.app` |
| `PORT` | Server port | `8000` |
| `LOG_LEVEL` | Logging level | `info` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (optional) | `https://api.onrender.com` |

---

## Maintenance

### Updating the Application

1. Push changes to your Git repository
2. Vercel and Render will automatically redeploy
3. Monitor deployment logs for any issues

### Monitoring

- **Render**: Check logs in the Render dashboard
- **Vercel**: Check function logs and analytics in Vercel dashboard
- **MongoDB**: Monitor database usage in Atlas

### Scaling

- **Render Free Tier**: Spins down after inactivity (cold starts)
- **Vercel**: Automatically scales
- **Upgrade**: Consider paid plans for production use

---

## Security Checklist

- [ ] Set specific CORS origin (not `*`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic with Vercel/Render)
- [ ] Regularly update dependencies
- [ ] Set up MongoDB IP whitelist properly
- [ ] Use strong database passwords
- [ ] Enable rate limiting (if needed)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs in Vercel and Render
3. Check browser console for frontend errors
4. Review backend logs in Render dashboard

Good luck with your deployment! 🚀
