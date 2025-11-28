# GitHub Pages Deployment Guide

## Frontend Deployment (GitHub Pages)

Your frontend is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

### Automatic Deployment (Recommended)

1. **Enable GitHub Pages in your repository:**
   - Go to: https://github.com/kishorekumarsunke/Sunke_Vasan_Varpe_Varadaraju/settings/pages
   - Under "Build and deployment"
   - Source: Select **GitHub Actions**
   - Save

2. **Push your changes:**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push
   ```

3. **Your site will be live at:**
   https://kishorekumarsunke.github.io/Sunke_Vasan_Varpe_Varadaraju

### Manual Deployment (Alternative)

```bash
cd frontend
npm run deploy:github
```

---

## Backend Deployment

⚠️ **Important:** GitHub Pages only hosts static sites. Your Node.js backend needs to be deployed separately.

### Recommended Backend Hosting Options:

#### Option 1: Render (Free Tier Available)
1. Go to https://render.com
2. Sign up with your GitHub account
3. Create a new "Web Service"
4. Connect your repository
5. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Add Environment Variables** from your `backend/.env` file

#### Option 2: Railway (Free Trial Available)
1. Go to https://railway.app
2. Connect your GitHub repository
3. Select the backend folder
4. Add environment variables
5. Deploy

#### Option 3: Vercel
1. Go to https://vercel.com
2. Import your repository
3. Configure root directory as `backend`
4. Add environment variables
5. Deploy

### Update Frontend API URL

Once your backend is deployed, update the frontend to point to your backend URL:

**In `frontend/.env`:**
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Then rebuild and redeploy:
```bash
git add frontend/.env
git commit -m "Update API URL"
git push
```

---

## Environment Variables Needed for Backend

Make sure to set these in your backend hosting platform:

- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_SECRET` - Your JWT secret key
- `FRONTEND_URL` - Your GitHub Pages URL
- `GROK_API_KEY` - Your Grok API key
- `PORT` - Usually set automatically by the hosting platform
- `NODE_ENV` - Set to `production`

---

## Troubleshooting

### Frontend shows 404 errors
- Make sure GitHub Pages is enabled in repository settings
- Check that the workflow ran successfully in the Actions tab
- Verify the base path in `vite.config.js` matches your repository name

### API calls fail
- Update `VITE_API_URL` in frontend with your deployed backend URL
- Enable CORS in backend for your GitHub Pages domain
- Ensure backend environment variables are set correctly

### Backend connection issues
- Verify Neon PostgreSQL connection string is correct
- Check that SSL is enabled in database configuration
- Review backend logs in your hosting platform
