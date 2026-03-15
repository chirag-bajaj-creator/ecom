# Deployment Guide

**Stack:** MongoDB Atlas (database) → Render (backend) → Vercel (frontend)

**Prerequisites:** GitHub account, MongoDB Atlas account, Render account, Vercel account (all free tier)

---

## Step 1: MongoDB Atlas Setup

1. Go to https://www.mongodb.com/atlas → Create free M0 cluster (nearest region)
2. Create a database user (username + strong password)
3. Network Access → Add `0.0.0.0/0` (allow all IPs — required for Render)
4. Click "Connect" → "Drivers" → Copy connection string
5. Replace `<password>` with your DB user password, replace database name with `ecommerce`

Final format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend on Render

1. Push code to GitHub
2. Go to https://render.com → New → Web Service → Connect GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| Root Directory | `ecommerce_structure-main/server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node src/server.js` |
| Plan | Free |

4. Add environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your Atlas connection string from Step 1 |
| `JWT_ACCESS_SECRET` | Run secret generator below (64 chars) |
| `JWT_REFRESH_SECRET` | Run secret generator below (different 64 chars) |
| `ADMIN_INVITE_CODE` | Your chosen admin invite code |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Step 3) |

5. Deploy → Note your Render URL: `https://your-app.onrender.com`
6. Test: `https://your-app.onrender.com/api/v1/health` should return `{ success: true }`

---

## Step 3: Deploy Frontend on Vercel

1. Go to https://vercel.com → Add New → Project → Import GitHub repo
2. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `ecommerce_structure-main/client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Add environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-app.onrender.com/api/v1` |
| `VITE_WS_URL` | `wss://your-app.onrender.com/ws` |

4. Deploy → Note your Vercel URL: `https://your-app.vercel.app`

---

## Step 4: Update Render with Vercel URL

Go to Render → Environment → Set `FRONTEND_URL` = `https://your-app.vercel.app` (exact URL, no trailing slash)

This enables CORS so your frontend can talk to the backend.

---

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Render backend is live (`/api/v1/health` responds)
- [ ] Vercel frontend loads without errors
- [ ] No CORS errors in browser console
- [ ] User registration and login works
- [ ] Product listing loads
- [ ] Cart and checkout works
- [ ] Delivery boy portal works
- [ ] Admin portal works
- [ ] WebSocket tracking connects
- [ ] `FRONTEND_URL` on Render matches exact Vercel URL
- [ ] `VITE_API_URL` on Vercel matches exact Render URL

---

## Common Issues

**Render free tier cold starts** — Backend sleeps after 15 min idle. First request takes ~30s. Fix: use https://cron-job.org to ping `/api/v1/health` every 14 minutes.

**CORS errors** — Verify `FRONTEND_URL` on Render matches your exact Vercel domain (no trailing slash). Check `credentials: true` is set.

**WebSocket not connecting** — Must use `wss://` (not `ws://`) in production. Verify `VITE_WS_URL` is set on Vercel.

**MongoDB connection fails** — Check Atlas IP whitelist has `0.0.0.0/0`. Verify connection string has correct password. URL-encode special characters in password.

**Build fails on Vercel** — Verify Root Directory is `ecommerce_structure-main/client`. Run `npm run build` locally first to catch errors.

---

## Generate Secrets

Run this twice (once for each secret):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
