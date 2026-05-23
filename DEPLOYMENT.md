# Deployment Guide - Attendance Management System

## 🚀 Quick Deploy (Recommended - FREE)

### Prerequisites
1. GitHub account (you already have ✅)
2. MongoDB Atlas account (free tier)
3. Vercel account (free)
4. Render account (free)

---

## Step 1: Setup MongoDB Atlas (Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login → Create FREE cluster
3. Choose:
   - Cloud Provider: AWS
   - Region: Closest to your users
   - Cluster Tier: M0 Sandbox (FREE)
4. Create cluster (takes 3-5 minutes)
5. **Security Setup:**
   - Database Access → Add New User
   - Username: `admin` (or your choice)
   - Password: Generate secure password (SAVE IT!)
   - Database User Privileges: Read and write to any database
6. **Network Access:**
   - Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   - Confirm
7. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string (looks like):
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/studentDb?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend (Render)

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository: `Attendance-Project`
5. Configure:
   ```
   Name: attendance-backend (or your choice)
   Region: Choose closest to you
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
6. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   SECRET_KEY=your_super_secret_jwt_key_12345
   HUGGINGFACE_API_KEY=your_huggingface_key
   MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/studentDb?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=https://your-app-name.vercel.app
   ```
   (You'll update CLIENT_URL after deploying frontend)

7. Click "Create Web Service"
8. Wait 5-10 minutes for deployment
9. **SAVE YOUR BACKEND URL**: `https://attendance-backend.onrender.com`

---

## Step 3: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your repository: `Attendance-Project`
5. Configure:
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
6. **Add Environment Variable:**
   ```
   VITE_API_URL=https://attendance-backend.onrender.com
   ```
   (Use your actual Render backend URL from Step 2)

7. Click "Deploy"
8. Wait 2-3 minutes
9. **YOUR APP IS LIVE!** 🎉
10. **SAVE YOUR FRONTEND URL**: `https://your-app-name.vercel.app`

---

## Step 4: Update Backend with Frontend URL

1. Go back to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `CLIENT_URL` variable:
   ```
   CLIENT_URL=https://your-app-name.vercel.app
   ```
5. Save changes (backend will auto-redeploy)

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Try to register a new student
3. Login and test features
4. If issues occur, check logs:
   - Render: Dashboard → Your Service → Logs
   - Vercel: Dashboard → Your Project → Deployments → View Function Logs

---

## 🎯 Alternative: Railway (Simpler but Limited Free Tier)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will detect both frontend and backend
6. Add MongoDB plugin (click "+" → Database → MongoDB)
7. Set environment variables for both services
8. Deploy!

**Note:** Railway gives $5 free credit/month (enough for small projects)

---

## 🔧 Troubleshooting

### Backend Issues:
- **Build fails**: Check `package.json` in server folder
- **Database connection error**: Verify MongoDB URI and IP whitelist
- **CORS error**: Ensure CLIENT_URL matches your Vercel URL exactly

### Frontend Issues:
- **API calls fail**: Check VITE_API_URL is correct
- **Build fails**: Run `npm run build` locally first to test
- **Blank page**: Check browser console for errors

### Common Fixes:
```bash
# If Render build fails, add this to server/package.json:
"engines": {
  "node": ">=16.0.0"
}

# If Vercel build fails, ensure client/package.json has:
"scripts": {
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Limits |
|---------|-----------|--------|
| MongoDB Atlas | ✅ Forever Free | 512MB storage |
| Render | ✅ Free | 750 hours/month, sleeps after 15min inactivity |
| Vercel | ✅ Free | 100GB bandwidth/month |
| **Total Cost** | **$0/month** | Perfect for portfolio/demo |

---

## 🚀 Going Live Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS updated with frontend URL
- [ ] Test registration and login
- [ ] Test attendance submission
- [ ] Test staff features
- [ ] Share your live URL! 🎉

---

## 📱 Your Live URLs

After deployment, you'll have:
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://attendance-backend.onrender.com`
- **Database**: MongoDB Atlas (cloud)

---

## 🎓 Pro Tips

1. **Custom Domain** (Optional):
   - Buy domain from Namecheap/GoDaddy
   - Add to Vercel: Settings → Domains
   - Free SSL included!

2. **Performance**:
   - Render free tier sleeps after 15min → First request takes 30-60s
   - Upgrade to $7/month for always-on backend

3. **Monitoring**:
   - Use Render logs to debug backend issues
   - Use Vercel Analytics (free) to track usage

4. **Updates**:
   - Push to GitHub → Auto-deploys to Vercel & Render!
   - No manual deployment needed

---

## Need Help?

- Render Docs: [render.com/docs](https://render.com/docs)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

Good luck with your deployment! 🚀
