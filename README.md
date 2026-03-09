# 🚀 DSA JourneyMate

A **full-stack DSA progress tracker** that helps students organize, track, and revise coding problems efficiently.
It includes a spaced repetition revision system, clean dashboard, streak tracking, and progress analytics.

🌐 **Live Demo:**
https://dsa-journey-mate.vercel.app/


# ✨ Features

- ✔ Problem Management
   - Add DSA problems with title, difficulty, and problem link
   - Update problem status:
     - Not Started
     - Attempted
     - Solved
   - Edit or delete problems anytime

- ✔ Search & Filtering
    - ✔ Search problems instantly
    - ✔ Filter problems by difficulty
    - ✔ Clean card-based UI for problem tracking

- ✔ Progress dashboard
    - Total problems count
    - Solved problems
    - Attempted problems
    - Not started problems
    
- ✔ Daily streak Tracker 
    - Tracks how many consecutive days you solved problems

- ✔ DSA progress Graph 
    - Visual chard showing problems solved per day
    - Helps track learning consistency

- ✔ Spaced Repetition Revision System
    - Automatically schedules revisions after solving a problem 
    - Revision intervals:
      - Day 1 → Day 3 → Day 7 → Day 14 → Day 30
- ✔ Revision Reminder
   - Problems automatically appear in the **Revision Problems** section when their revision date arrives.


# 🧠 How It Works

1. Add problems you want to solve.
2. Track your progress as **Attempted or Solved**.
3. View your progress in the **dashboard & graph**.
4. Get reminders for problems that need **revision**.
5. Maintain a **daily streak** while practicing DSA.


# 📸 Screenshots

### Dashboard
![Dashboard](screenshots/DashboardAndGraph.png)

### Add Problem
![Add Problem](screenshots/add-problem.png)

### Revision System
![Revision](screenshots/revision.png)


# 🛠 Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Deployment

Frontend → Vercel
Backend → Render


# ⚙️ Installation (Run Locally)

Clone the repository

```bash
git clone https://github.com/Toshima17/DSA-JourneyMate.git
cd DSA-JourneyMate
```

Install dependencies

```bash
npm install
```

Create Environment File (.env file)

```bash
MONGO_URI=your_mongodb_connection_string
```

Start the server

```bash
node server.js
```

Open the frontend

```bash
frontend/index.html
```


# 📊 Project Structure

```
DSA-JourneyMate
│
├── frontend
│   ├── index.html
│   └── style.css
│
├── server.js
├── package.json
├── .gitignore
└── README.md
```


# 🎯 Future Improvements

* User authentication (Login / Signup)
* Topic tagging (Arrays, Graphs, DP, etc.)
* AI-based problem recommendations
* Advanced analytics dashboard
* Weekly progress report


# 👩‍💻 Author

**Toshima Rahangdale**

B.Tech CSE Student
Samrat Ashok Technological Institute, Vidisha

GitHub:
https://github.com/Toshima17


⭐ If you like this project, consider giving it a **star** on GitHub!
