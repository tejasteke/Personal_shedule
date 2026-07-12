DayFlow Scheduler

DayFlow is an elegant, highly interactive daily planner and timeline scheduler. It features a sleek glassmorphic UI, robust time-conflict detection, and a built-in analytics dashboard to track your daily progress. The application has been customized with a traditional Indian aesthetic, featuring a beautiful Diya (oil lamp) logo and Tricolor styling.

Features
You get a visual timeline where you can slot tasks into an intuitive 24-hour daily timeline that even supports overnight tasks across midnight. There is a list view and analytics dashboard where you can view tasks chronologically or filter by priority, and track your focus time, completion rates, and categorical workloads. It has conflict detection to automatically warn you if you accidentally double-book a time slot. It uses a local SQLite database to quickly store and retrieve all your tasks directly from a local .db file. You'll enjoy a modern, frosted-glass design with seamless dark mode support. You can also generate PDF backups of your daily schedule with a single click.

Technology Stack
This app is built using Vanilla HTML5, CSS3, and JavaScript on the frontend. The backend runs on Node.js and Express.js, using SQLite3 for the database and jsPDF for generating PDFs.

Running Locally
To run this application on your local machine, make sure you have Node.js installed. First, clone or download this repository. Then open your terminal in the project directory and run npm install. Once that's done, you can start the server by running npm start. Finally, open your web browser and go to http://localhost:3000.

Deploying to a Live Host
Because DayFlow uses a Node.js Express backend and an SQLite database, it cannot be hosted on static hosting services like GitHub Pages or Vercel's standard tier. It requires an environment that can run Node.js and maintain a persistent file system for the SQLite database.

If you want to host it on Railway or Render (which are great for Node apps), just connect your GitHub repository to the platform. Set the build command to npm install and the start command to npm start. Note that these platforms use ephemeral file systems, so your database will reset on every deployment unless you configure a Persistent Volume in their settings and ensure the dayflow.db file is saved inside that volume.

If you have a Virtual Private Server like DigitalOcean, Linode, or AWS EC2, you can clone the repository onto your server, run npm install, and use a process manager like PM2 to keep the app running. You can start it with pm2 start server.js --name "dayflow" and then configure an Nginx reverse proxy to route traffic from port 80 or 443 to port 3000.

If you really want to host this on Vercel, Netlify, or GitHub Pages for free, you would need to modify the code to remove server.js and SQLite, and just rely on localStorage in the frontend, or migrate the backend to use a cloud database like Firebase instead of SQLite.

License
This project is licensed under the MIT License.
