# Deployment Guide - Iron Lord 10

Complete guide for deploying your betting analytics application to production using Render (backend) and Vercel (frontend).

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with your code
- [ ] Render account (https://render.com)
- [ ] Vercel account (https://vercel.com)
- [ ] MongoDB Atlas account (https://www.mongodb.com/cloud/atlas) OR MongoDB on Render
- [ ] Odds API key (https://the-odds-api.com/)

---

## Part 1: Database Setup (MongoDB Atlas)

### Option A: MongoDB Atlas (Recommended)

1. **Create Cluster:**
   - Go to https://cloud.mongodb.com
   - Create a free M0 cluster
   - Choose a region close to your Render deployment

2. **Configure Access:**
   - Database Access → Add User
   - Username: `ironlord_admin`
   - Password: Generate strong password → **Save this!**
   - Role: `Atlas admin`

3. **Network Access:**
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Render to connect

4. **Get Connection String:**
   - Clusters → Connect → Connect your application
   - Copy connection string:
     ```
     mongodb+srv://ironlord_admin:<password>@cluster0.xxxxx.mongodb.net/ironman?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - **Save this connection string!**

### Option B: MongoDB on Render

1. Follow Render's MongoDB documentation
2. Uncomment the MongoDB service in `render.yaml`

---

## Part 2: Backend Deployment (Render)

### 1. Create Web Service

1. **Go to Render Dashboard:**
   - https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository:**
   - Connect your GitHub account
   - Select your `Iron-Lord-10` repository
   - Click "Connect"

3. **Configure Service:**
   ```
   Name: ironlord-backend
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Python 3
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **Select Plan:**
   - Choose "Free" plan (or paid for better performance)

### 2. Set Environment Variables

In the Render dashboard, add these environment variables:

```bash
MONGO_URI=mongodb+srv://ironlord_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ironman
ODDS_API_KEY=your_odds_api_key_here
CORS_ORIGIN=https://your-app.vercel.app
LOG_LEVEL=info
```

**Important:**
- Don't commit these to GitHub!
- Update `CORS_ORIGIN` after deploying frontend

### 3. Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. You'll get a URL like: `https://ironlord-backend.onrender.com`
4. Test: Visit `https://ironlord-backend.onrender.com/health`
   - Should return: `{"ok": true}`

### 4. Set Up Database Indexes

After first deployment:

1. In Render Dashboard, go to your service
2. Click "Shell" tab
3. Run:
   ```bash
   cd backend/db
   python setup_indexes.py
   ```

---

## Part 3: Frontend Deployment (Vercel)

### 1. Prepare Frontend

1. **Create `.env.production` file locally:**
   ```bash
   VITE_API_URL=https://ironlord-backend.onrender.com
   ```

2. **Test build locally:**
   ```bash
   npm install
   npm run build
   ```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Easier)

1. **Go to Vercel:**
   - https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Repository:**
   - Connect GitHub
   - Select `Iron-Lord-10` repository
   - Click "Import"

3. **Configure Project:**
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variable:**
   - Environment Variables section
   - Add: `VITE_API_URL` = `https://ironlord-backend.onrender.com`
   - Select: Production, Preview, Development

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get URL: `https://your-app.vercel.app`

#### Option B: Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://ironlord-backend.onrender.com
# Select: Production
```

---

## Part 4: Update CORS Settings

Now that you have your frontend URL:

1. **Go to Render Dashboard**
2. **Open your backend service**
3. **Environment → Edit**
4. **Update `CORS_ORIGIN`:**
   ```
   CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173,http://localhost:3000
   ```
5. **Save Changes**
6. Service will automatically redeploy

---

## Part 5: Testing Production Deployment

### 1. Test Backend

```bash
# Health check
curl https://ironlord-backend.onrender.com/health

# Should return: {"ok":true}

# Test logging a bet
curl -X POST https://ironlord-backend.onrender.com/api/bets/log \
  -H "Content-Type: application/json" \
  -d '{
    "user": "testuser",
    "matchup": "Lakers vs Celtics",
    "sportsbook": "FanDuel",
    "sport": "basketball",
    "odds": 2.1,
    "stake": 100,
    "closing_odds": 2.0
  }'

# Get bet history
curl https://ironlord-backend.onrender.com/api/bets/history/testuser
```

### 2. Test Frontend

1. Visit `https://your-app.vercel.app`
2. Log a bet using the form
3. Check Bet History
4. Expand calculation breakdown

### 3. Check Browser Console

- Should see no CORS errors
- API calls should succeed
- Check Network tab for API requests

---

## Part 6: Custom Domain (Optional)

### For Vercel (Frontend):

1. **Vercel Dashboard:**
   - Project Settings → Domains
   - Add your domain: `ironlord.com`
   - Follow DNS configuration instructions

2. **Update CORS:**
   - Add new domain to Render's `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://ironlord.com,https://your-app.vercel.app
     ```

### For Render (Backend):

1. **Render Dashboard:**
   - Service → Settings → Custom Domain
   - Add: `api.ironlord.com`
   - Configure DNS CNAME

2. **Update Frontend:**
   - Vercel → Environment Variables
   - Update `VITE_API_URL` to `https://api.ironlord.com`
   - Redeploy

---

## Troubleshooting

### Backend Won't Start

**Check Render logs:**
```
Dashboard → Your Service → Logs
```

**Common issues:**
- MongoDB connection string incorrect
- Missing environment variables
- Python version mismatch

**Solution:**
- Verify `MONGO_URI` is correct
- Check all env vars are set
- Ensure `requirements.txt` is complete

### CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" error in browser console
- API calls failing from frontend

**Solution:**
1. Check `CORS_ORIGIN` env var in Render
2. Must include exact frontend URL (no trailing slash)
3. Redeploy backend after changing

### Frontend Shows Blank Page

**Check Vercel logs:**
```
Dashboard → Your Project → Deployments → View Function Logs
```

**Common issues:**
- Build failed
- Environment variables not set
- API URL incorrect

**Solution:**
- Check build logs for errors
- Verify `VITE_API_URL` is set
- Test API endpoint directly

### MongoDB Connection Fails

**Symptoms:**
- Backend logs show "Failed to connect to MongoDB"
- 500 errors when logging bets

**Solution:**
1. Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
2. Check connection string format
3. Ensure password has no special characters or is URL-encoded
4. Test connection string with MongoDB Compass

### Free Tier Limitations

**Render Free Tier:**
- Spins down after 15 min of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month

**Solution:**
- Use UptimeRobot to ping every 10 minutes
- Or upgrade to paid plan ($7/month)

**MongoDB Atlas Free Tier:**
- 512MB storage
- Shared CPU
- Should be enough for testing

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Usually sufficient

---

## Monitoring & Maintenance

### 1. Set Up Monitoring

**UptimeRobot (Free):**
1. https://uptimerobot.com
2. Add monitor: `https://ironlord-backend.onrender.com/health`
3. Check interval: 5 minutes
4. Get email alerts for downtime

### 2. View Logs

**Render:**
- Dashboard → Service → Logs (real-time)

**Vercel:**
- Dashboard → Project → Deployments → Function Logs

**MongoDB Atlas:**
- Clusters → Metrics tab

### 3. Database Backups

**MongoDB Atlas (Automatic):**
- Free tier includes automatic backups
- Cloud Backups → Configure

**Manual Backup:**
```bash
mongodump --uri="mongodb+srv://..."
```

---

## CI/CD (Automatic Deployments)

### How It Works:

Both Render and Vercel automatically deploy when you push to GitHub:

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Automatic Actions:**
   - Vercel deploys frontend (2-3 min)
   - Render deploys backend (5-10 min)

3. **Notifications:**
   - Check email for deployment status
   - Or visit dashboards

### Deploy Preview (Branches):

**Create feature branch:**
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

**Vercel automatically creates preview URL:**
- `https://iron-lord-git-feature-new-feature.vercel.app`
- Test changes before merging

---

## Environment Variables Checklist

### Backend (Render):
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `ODDS_API_KEY` - Odds API key
- [ ] `CORS_ORIGIN` - Frontend URLs (comma-separated)
- [ ] `LOG_LEVEL` - Set to "info"

### Frontend (Vercel):
- [ ] `VITE_API_URL` - Backend URL

---

## Security Checklist

- [ ] MongoDB password is strong (20+ characters)
- [ ] API keys are stored in environment variables (not in code)
- [ ] CORS is restricted to your domains only
- [ ] MongoDB IP whitelist configured
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] No sensitive data in Git history

---

## Costs

### Free Tier:
- Render: Free (with limitations)
- Vercel: Free (generous limits)
- MongoDB Atlas: Free M0 (512MB)
- **Total: $0/month**

### Recommended Paid Tier:
- Render Starter: $7/month (no spin-down)
- Vercel Pro: $20/month (better performance)
- MongoDB M10: $10/month (dedicated cluster)
- **Total: $37/month**

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/

---

## Quick Reference

### Useful Commands:

```bash
# Frontend
npm install                    # Install dependencies
npm run dev                    # Run locally
npm run build                  # Build for production
vercel --prod                  # Deploy to Vercel

# Backend
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Run locally
python db/setup_indexes.py         # Create indexes

# Git
git status                         # Check changes
git add .                          # Stage all changes
git commit -m "message"            # Commit
git push origin main               # Push to GitHub (triggers deploy)
```

### Important URLs:

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- Your Backend: https://ironlord-backend.onrender.com
- Your Frontend: https://your-app.vercel.app

---

## Next Steps After Deployment

1. **Test everything thoroughly**
2. **Set up monitoring with UptimeRobot**
3. **Configure custom domain** (optional)
4. **Share with beta testers**
5. **Monitor logs for errors**
6. **Set up analytics** (Google Analytics, Plausible, etc.)
7. **Implement remaining features from code review**

---

🎉 **Congratulations!** Your Iron Lord 10 betting analytics app is now live!
