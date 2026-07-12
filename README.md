# DayFlow Scheduler 🪔

**DayFlow** is an elegant, highly interactive daily planner and timeline scheduler. It features a sleek glassmorphic UI, robust time-conflict detection, and a built-in analytics dashboard to track your daily progress. 

The application has been customized with a traditional Indian aesthetic, featuring a beautiful Diya (oil lamp) logo and Tricolor styling.

## 🌟 Features

- **Visual Timeline**: Drag-and-drop or slot tasks into an intuitive 24-hour daily timeline (supports overnight tasks across midnight).
- **List View & Analytics**: View tasks chronologically or filter by priority. Track your focus time, completion rates, and categorical workloads on the Analytics dashboard.
- **Conflict Detection**: Automatically warns you if you accidentally double-book a time slot.
- **Local Database**: Built with SQLite to quickly store and retrieve all your tasks directly from a local `.db` file.
- **Glassmorphic UI**: Enjoy a modern, frosted-glass design with seamless dark mode support.
- **PDF Export**: Generate PDF backups of your daily schedule with a single click.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no framework required)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Tools**: jsPDF (for PDF generation)

---

## 🚀 Running Locally

To run this application on your local machine, ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone or Download** this repository.
2. **Install Dependencies**:
   Open your terminal in the project directory and run:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. **Open in Browser**:
   Navigate to `http://localhost:3000` in your web browser.

---

## ☁️ Deploying to a Live Host

Because DayFlow uses a **Node.js Express backend** and an **SQLite database**, it cannot be hosted on static hosting services (like GitHub Pages or Vercel's standard tier). It requires an environment that can run Node.js and maintain a persistent file system for the SQLite `.db` file.

Here are the recommended ways to host DayFlow live:

### Option A: Railway or Render (Recommended for Node Apps)
Services like [Railway](https://railway.app/) or [Render](https://render.com/) are excellent for Node.js apps.
1. Connect your GitHub repository to your chosen platform.
2. Set the build command to `npm install` and the start command to `npm start`.
3. **Important Note on SQLite**: These platforms use "ephemeral" file systems by default (meaning your database will reset on every deployment). To keep your data permanent, you must configure a **Persistent Volume / Disk** in their settings and ensure the `dayflow.db` file is saved inside that volume.

### Option B: VPS (DigitalOcean, Linode, AWS EC2)
If you have a Virtual Private Server:
1. Clone the repository onto your server.
2. Run `npm install`.
3. Use a process manager like [PM2](https://pm2.keymetrics.io/) to keep the app running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "dayflow"
   ```
4. Configure an Nginx reverse proxy to route traffic from port 80/443 to port 3000.

### Option C: Modifying for Static Hosting
If you wish to host this on Vercel, Netlify, or GitHub Pages for free, you would need to modify the code to remove `server.js` and SQLite, relying purely on `localStorage` in the frontend (`app.js` already contains fallback functions for this) or migrate the backend to use a cloud database (like Firebase or MongoDB) instead of SQLite.

---

## 📄 License

This project is licensed under the MIT License.
