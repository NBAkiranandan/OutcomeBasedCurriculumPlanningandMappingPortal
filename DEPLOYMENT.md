# OBCP Portal — Production Deployment Guide

This guide outlines the steps required to deploy the Aditya University Outcome-Based Curriculum Planning & Mapping Portal (OBCP) on a college server for production use.

## 1. Prerequisites

Before beginning, ensure the target server has the following installed:
*   **Node.js**: v18.x or v20.x (LTS recommended)
*   **MongoDB**: v6.0 or higher (or a valid MongoDB Atlas connection string)
*   **Git**: For version control and fetching the code
*   **PM2**: Process manager for keeping the Node.js backend running in the background. Install globally: `npm install -g pm2`
*   **Nginx** (Optional but Recommended): For reverse proxy and SSL termination.

## 2. Server Setup & Cloning

Clone the repository to your production server:

```bash
git clone <your-repository-url> /var/www/obcpmp
cd /var/www/obcpmp
```

Install dependencies for both frontend and backend using the provided script:

```bash
npm run install:all
```

## 3. Environment Configuration

### Backend Environment (`backend/.env`)

Create a `.env` file in the `backend` directory:

```env
PORT=5001
HOST=127.0.0.1
MONGO_URI=mongodb://127.0.0.1:27017/obcpmp?directConnection=true
JWT_SECRET=your_super_secure_production_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_production_refresh_secret_here
NODE_ENV=production
CORS_ORIGIN=http://your-college-domain.edu,https://your-college-domain.edu
```

*Note: Replace `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CORS_ORIGIN` with actual production values.*

### Frontend Environment (`frontend/.env.production`)

Create a `.env.production` file in the `frontend` directory:

```env
VITE_API_BASE_URL=
```
*(Leave this blank. In production, the backend Express server serves the built frontend files, so API requests will naturally hit the same origin `/api/...`)*

## 4. Build the Frontend

Compile the React/Vite frontend into static assets for production:

```bash
npm run build:all
```
This will create a `frontend/dist` directory containing the optimized, minified production build. The backend is configured to automatically serve these files when `NODE_ENV=production`.

## 5. Starting the Application (Production Mode)

Use PM2 to start the backend. PM2 will automatically keep the application running, handle restarts on crashes, and manage logs.

```bash
cd backend
pm2 start app.js --name "obcpm-portal" --time
```

### Auto-Start on Server Reboot
To ensure the portal starts automatically if the server restarts:
```bash
pm2 startup
pm2 save
```

## 6. Reverse Proxy Configuration (Nginx) - Optional but Recommended

If you want to map the application to a domain (e.g., `obcp.aditya.ac.in`) and use port 80/443 instead of exposing port 5001 directly, configure Nginx.

Create a new Nginx configuration file: `/etc/nginx/sites-available/obcpmp`

```nginx
server {
    listen 80;
    server_name obcp.aditya.ac.in;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/obcpmp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Useful Maintenance Commands

*   **View Logs**: `pm2 logs obcpm-portal`
*   **Restart Server**: `pm2 restart obcpm-portal`
*   **Stop Server**: `pm2 stop obcpm-portal`
*   **Kill Stray Ports**: If the server crashes and the port is stuck, run `npm run kill-port` from the project root.

---

### Security Audits Applied for Production
*   **Helmet & CORS**: Configured securely.
*   **Rate Limiting**: Applied to `/api` routes to prevent DDoS or brute-force attacks (500 requests / 15 mins).
*   **No Source Maps**: Production builds exclude source maps to protect source code.
*   **Graceful Error Handling**: `EADDRINUSE` and other unhandled exceptions now gracefully shutdown the server to allow PM2/Nodemon to restart it cleanly without leaving zombie processes.
