# 🚀 Step-by-Step Hosting Guide for KFC App

This guide explains how to host your **KFC Football Club Application** online for free using **MongoDB Atlas**, **Render** (Backend), and **Vercel** (Frontend).

---

## 📋 OVERVIEW

| Component | Platform | Free Plan Available? |
|---|---|---|
| **Database** | MongoDB Atlas | ✅ Yes (Free 512MB Cluster) |
| **Backend Server (API & WebSockets)** | Render.com | ✅ Yes (Free Web Service) |
| **Frontend Website (React)** | Vercel.com | ✅ Yes (Free Global CDN) |

---

## STEP 1: Set Up Online Database (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Create Cluster** and select the **M0 Free Shared Tier**.
3. Create a **Database User**:
   - Username: `kfcadmin`
   - Password: (Create a strong password and save it)
4. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** to copy your **Mongo Connection String**:
   ```text
   mongodb+srv://kfcadmin:<YOUR_PASSWORD>@cluster0.mongodb.net/kfc-db?retryWrites=true&w=majority
   ```

---

## STEP 2: Host the Backend Server on Render.com

1. Push your project repository to **GitHub** (if not already done).
2. Go to [Render.com](https://render.com) and create a free account.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository and set the following settings:
   - **Name**: `kfc-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value |
|---|---|
| `PORT` | `4000` |
| `MONGO_URI` | Your MongoDB Atlas connection URL from Step 1 |
| `JWT_SECRET` | `your_secret_key_here_change_this` |
| `CLIENT_URL` | Your frontend Vercel URL (e.g., `https://kfc-club.vercel.app`) |
| `ADMIN_EMAIL` | `admin@kfc.com` |
| `ADMIN_PASSWORD` | `admin123` |
| `TWILIO_SID` | (Optional - leave blank for console SMS simulation) |
| `TWILIO_AUTH_TOKEN` | (Optional) |
| `TWILIO_PHONE_NUMBER` | (Optional) |

6. Click **Create Web Service**. Wait for Render to build. Once finished, copy your Backend URL:
   `https://kfc-backend.onrender.com`

---

## STEP 3: Host the Frontend Website on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project** -> Select your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://kfc-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://kfc-backend.onrender.com` |

5. Click **Deploy**. Vercel will build and launch your live website URL! (e.g., `https://kfc-club.vercel.app`)

---

## STEP 4: Update Backend CORS to Allow Frontend URL

Go back to your **Render.com** Dashboard for `kfc-backend`:
1. Go to **Environment**.
2. Update `CLIENT_URL` value to your exact Vercel website URL: `https://kfc-club.vercel.app`.
3. Save changes. Render will automatically redeploy!

---

## 🎉 YOUR APP IS LIVE!
- **Frontend URL**: `https://kfc-dun.vercel.app`
- **Backend API URL**: `https://kfc-backend-6m2z.onrender.com/api`
- Real-time Socket.io chat, video calls, line-ups, and notifications will work seamlessly online!
