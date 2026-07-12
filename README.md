# DayFlow Scheduler

DayFlow is an elegant, highly interactive daily planner and timeline scheduler. It features a sleek glassmorphic UI, robust time-conflict detection, and a built-in analytics dashboard to track your daily progress. The application has been customized with a traditional Indian aesthetic, featuring a beautiful Diya (oil lamp) logo and Tricolor styling.

### Key Features
1. Visual Timeline: You can slot tasks into an intuitive 24-hour daily timeline that even supports overnight tasks across midnight.
2. List View and Analytics: View tasks chronologically or filter by priority. The analytics dashboard lets you track your focus time, completion rates, and categorical workloads.
3. Conflict Detection: The app automatically warns you if you accidentally double-book a time slot.
4. Local Database: It uses a local SQLite database to quickly store and retrieve all your tasks directly from a local database file.
5. Glassmorphic UI: You'll enjoy a modern, frosted-glass design with seamless dark mode support.
6. PDF Export: Generate PDF backups of your daily schedule with a single click.

### Technology Stack
This app is built using Vanilla HTML5, CSS3, and JavaScript on the frontend. The backend runs on Node.js and Express.js, using SQLite3 for the database and jsPDF for generating PDFs.

### Running Locally
To run this application on your local machine, make sure you have Node.js installed.
1. Clone or download this repository.
2. Open your terminal in the project directory and run `npm install`.
3. Start the server by running `npm start`.
4. Open your web browser and go to `http://localhost:3000`.

### Deploying to a Live Host
Because DayFlow uses a Node.js Express backend and an SQLite database, it cannot be hosted on static hosting services like GitHub Pages or Vercel's standard tier. It requires an environment that can run Node.js and maintain a persistent file system for the SQLite database.

**Railway or Render (Recommended)**
If you want to host it on Railway or Render, connect your GitHub repository to the platform. Set the build command to `npm install` and the start command to `npm start`. Note that these platforms use ephemeral file systems, so your database will reset on every deployment unless you configure a Persistent Volume in their settings and ensure the database file is saved inside that volume.

**Virtual Private Server**
If you have a Virtual Private Server like DigitalOcean, Linode, or AWS EC2, you can clone the repository onto your server, run `npm install`, and use a process manager like PM2 to keep the app running. You can start it with `pm2 start server.js --name "dayflow"` and then configure an Nginx reverse proxy to route traffic from port 80 or 443 to port 3000.

### License
This project is licensed under the MIT License.
