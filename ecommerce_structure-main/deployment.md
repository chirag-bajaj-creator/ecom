# Deployment Guide

## Architecture

- **Frontend:** Vercel (React + Vite)
- **Backend:** Render (Node.js + Express)
- **Database:** MongoDB Atlas (cloud)
- **WebSocket:** Render (same server)

---

## Prerequisites

1. GitHub account (repo pushed to GitHub)
2. MongoDB Atlas account (free tier: https://www.mongodb.com/atlas)
3. Render account (free tier: https://render.com)
4. Vercel account (free tier: https://vercel.com)

---

## Step 1: MongoDB Atlas Setup

1. Go to https://www.mongodb.com/atlas and create a free cluster
2. Create a database user (username + password)
3. Whitelist IP: Add `0.0.0.0/0` (allow all — required for Render)
4. Get connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`
5. Replace `<username>` and `<password>` with your credentials

---

## Step 2: Deploy Backend on Render

### 2.1 Push Code to GitHub

Make sure your full project is pushed to a GitHub repository.

### 2.2 Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `ecommerce-api` (or your choice) |
| **Region** | Choose nearest to your users |
| **Root Directory** | `ecommerce_structure-main/server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free |

### 2.3 Set Environment Variables on Render

Go to **Environment** tab and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority` |
| `JWT_SECRET` | Generate a strong random string (min 32 chars) |
| `JWT_REFRESH_SECRET` | Generate a different strong random string (min 32 chars) |
| `ADMIN_INVITE_CODE` | Your chosen admin invite code |
| `CLIENT_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |

### 2.4 After Deploy

- Note your Render URL: `https://ecommerce-api-xxxx.onrender.com`
- Test: `https://ecommerce-api-xxxx.onrender.com/api/v1/products` should return a response

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Create Project on Vercel

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `ecommerce_structure-main/client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.2 Set Environment Variables on Vercel

Go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://ecommerce-api-xxxx.onrender.com/api/v1` |
| `VITE_WS_URL` | `wss://ecommerce-api-xxxx.onrender.com/ws` |

### 3.3 Create vercel.json

This file should exist in `client/` folder:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures React Router works correctly on page refresh.

### 3.4 After Deploy

- Note your Vercel URL: `https://your-app.vercel.app`
- Go back to **Render** and update `CLIENT_URL` env var with this URL

---

## Step 4: Update CORS for Production

In `server/src/app.js`, ensure CORS allows your Vercel domain:

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
```

---

## Step 5: Update Frontend API Config

In `client/src/api/axios.js`, ensure it uses the environment variable:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});
```

For WebSocket connections, use:

```javascript
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
```

---

## Step 6: WebSocket on Render

- Render supports WebSocket on free tier
- Use `wss://` (secure) in production, not `ws://`
- Render automatically handles SSL termination
- Free tier has cold starts (first request after 15 min idle takes ~30 seconds)

---

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Render backend is live and API responds
- [ ] Vercel frontend loads without errors
- [ ] CORS is configured (no blocked requests in browser console)
- [ ] Environment variables are set on both Render and Vercel
- [ ] User registration and login works
- [ ] Product listing loads
- [ ] Cart operations work
- [ ] Checkout and order creation works
- [ ] Delivery boy portal works
- [ ] WebSocket tracking connects (check browser console for WS errors)
- [ ] Admin portal works (Phase 6)
- [ ] `CLIENT_URL` on Render matches actual Vercel URL
- [ ] `VITE_API_URL` on Vercel matches actual Render URL

---

## Common Issues

### Render free tier cold starts
Backend sleeps after 15 minutes of inactivity. First request takes ~30 seconds. Solutions:
- Use a cron job to ping your API every 14 minutes (e.g., https://cron-job.org)
- Upgrade to paid plan ($7/month)

### CORS errors
- Verify `CLIENT_URL` on Render matches your exact Vercel domain (no trailing slash)
- Check that `credentials: true` is set in CORS config

### WebSocket not connecting
- Use `wss://` not `ws://` in production
- Verify `VITE_WS_URL` is set on Vercel
- Check Render logs for WebSocket initialization errors

### MongoDB connection fails
- Verify IP whitelist on Atlas includes `0.0.0.0/0`
- Check `MONGODB_URI` has correct username, password, and database name
- Ensure no special characters in password are URL-encoded

### Build fails on Vercel
- Check that `Root Directory` is set to `ecommerce_structure-main/client`
- Ensure all dependencies are in `package.json` (not just devDependencies)
- Run `npm run build` locally first to catch errors

---

## Generate Strong Secrets

Run this in terminal to generate random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.
