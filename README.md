# Browser Authorization and Activity Monitoring System

A complete full-stack system consisting of a Chrome Extension to lock out unauthenticated users and track their browser history, a Node.js/Express backend API for ingesting logs, and a React Admin Dashboard to visualize real-time tracking data and security alerts.

## Project Structure

```text
/
├── backend/          // Node.js + Express API + Mongoose models
├── extension/        // Chrome Extension (Manifest V3)
└── dashboard/        // React + Vite + Tailwind CSS Admin Dashboard
```

## Setup Instructions

### 1. Database Setup
Ensure you have MongoDB running locally on `mongodb://127.0.0.1:27017` or update the `.env` file in the `backend` directory.

### 2. Run Backend
```bash
cd backend
npm install
npm start
```
*The API will start on port 5000.*

### 3. Run Admin Dashboard
```bash
cd dashboard
npm install
npm run dev
```
*The Dashboard will start on Vite's default port (usually 5173).*

### 4. Install Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `/extension` directory in this workspace.

---

## Testing / Walkthrough

### 1. Register an Admin Account via Postman
Since the UI requires login, first create an administrator using Postman (or curl):
**POST** `http://localhost:5000/auth/register`
**Body (JSON)**:
```json
{
    "email": "admin@test.com",
    "password": "securepassword",
    "role": "admin"
}
```

### 2. Register a Regular User
**POST** `http://localhost:5000/auth/register`
**Body (JSON)**:
```json
{
    "email": "user@test.com",
    "password": "userpassword",
    "role": "user"
}
```

### 3. Test Extension Lock behavior
1. With the extension loaded, open a new tab. You should immediately be redirected to `chrome-extension://<id>/overlay.html`.
2. Enter the credentials (`user@test.com` / `userpassword`).
3. You will be redirected to Google and unlock your session.

### 4. Generate Activity Logs
1. Navigate to various sites like `https://example.com`, `https://github.com`.
2. Try navigating to `https://malicious.com` (this will trigger a backend alert).
3. Switch between tabs.
4. The extension accumulates these logs in IndexedDB and syncs them to `http://localhost:5000/api/logs` every 1 minute.

### 5. View Admin Dashboard
1. Open the React Dashboard.
2. Login as the admin (`admin@test.com` / `securepassword`).
3. View the logs incoming and verify the Security Alerts tab flags the `malicious.com` navigation.

---

## Security Implementation Features

1. **API JWT Protection:** Guarding log sync and dashboard requests.
2. **Password Hashing:** `bcrypt` used before DB storage.
3. **Local Token Integrity:** Tokens stored cleanly in `chrome.storage.local`.
4. **Helmet & Rate Limiting:** Applied to Node server against DDOS or Header attacks.
