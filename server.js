require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsa_journeymate";

// Spaced repetition interval schedule in days
const REVISION_INTERVALS = [1, 3, 7, 14, 30];

// Calculate future date based on repetition level
function calculateNextRevisionDate(level) {
    const clampedLevel = Math.min(Math.max(level, 0), REVISION_INTERVALS.length - 1);
    const daysToAdd = REVISION_INTERVALS[clampedLevel];
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// Mongoose connection
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((err) => {
        console.error("MongoDB Connection Error:", err.message);
        console.log("Tip: Provide MONGO_URI in .env or run a local MongoDB instance.");
    });

// Schema definition
const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2
        },
        difficulty: {
            type: String,
            required: true,
            enum: ["Easy", "Medium", "Hard"]
        },
        status: {
            type: String,
            enum: ["Not Started", "Attempted", "Solved"],
            default: "Not Started"
        },
        link: {
            type: String,
            required: true,
            trim: true
        },
        logic: {
            type: String,
            default: ""
        },
        tags: {
            type: [String],
            default: []
        },
        revisionLevel: {
            type: Number,
            default: 0
        },
        nextRevision: {
            type: Date,
            default: null
        },
        solvedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const Problem = mongoose.model("Problem", problemSchema);

// API Health Check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "DSA JourneyMate API is running",
        timestamp: new Date()
    });
});

// Create new problem
app.post("/add-problem", async (req, res) => {
    try {
        const { title, difficulty, link, logic, tags, status } = req.body;
        const initialStatus = status || "Not Started";
        let nextRevision = null;
        let solvedAt = null;

        // Only schedule revision if problem is Solved
        if (initialStatus === "Solved") {
            solvedAt = new Date();
            nextRevision = calculateNextRevisionDate(0);
        }

        const formattedTags = Array.isArray(tags)
            ? tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean)
            : [];

        const newProblem = await Problem.create({
            title: title ? title.trim() : "",
            difficulty,
            link: link ? link.trim() : "",
            logic: logic || "",
            tags: formattedTags,
            status: initialStatus,
            revisionLevel: 0,
            nextRevision,
            solvedAt
        });

        res.status(201).json(newProblem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all problems with optional filters
app.get("/problems", async (req, res) => {
    try {
        const { difficulty, tag, search } = req.query;
        const filter = {};

        if (difficulty) {
            filter.difficulty = difficulty;
        }
        if (tag) {
            filter.tags = tag.toLowerCase();
        }
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        const problems = await Problem.find(filter).sort({ createdAt: -1 });
        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single problem by ID
app.get("/problems/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json(problem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete problem
app.delete("/delete-problem/:id", async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json({ message: "Problem deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update full problem details
app.put("/update-problem/:id", async (req, res) => {
    try {
        const { title, difficulty, link, logic, tags, status } = req.body;
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        if (title !== undefined) problem.title = title.trim();
        if (difficulty !== undefined) problem.difficulty = difficulty;
        if (link !== undefined) problem.link = link.trim();
        if (logic !== undefined) problem.logic = logic;
        if (tags !== undefined) {
            problem.tags = Array.isArray(tags)
                ? tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean)
                : [];
        }

        if (status !== undefined && status !== problem.status) {
            problem.status = status;
            if (status === "Solved") {
                if (!problem.solvedAt) problem.solvedAt = new Date();
                problem.nextRevision = calculateNextRevisionDate(problem.revisionLevel || 0);
            } else {
                problem.nextRevision = null;
            }
        }

        await problem.save();
        res.json(problem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update status
app.patch("/update-status/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const problem = await Problem.findById(id);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        problem.status = status;

        if (status === "Solved") {
            if (!problem.solvedAt) {
                problem.solvedAt = new Date();
            }
            problem.nextRevision = calculateNextRevisionDate(problem.revisionLevel || 0);
        } else {
            problem.nextRevision = null;
        }

        await problem.save();
        res.json(problem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update status to Attempted
app.patch("/update-attempt/:id", async (req, res) => {
    try {
        const problem = await Problem.findByIdAndUpdate(
            req.params.id,
            { status: "Attempted", nextRevision: null },
            { new: true }
        );
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json(problem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get problems due for spaced repetition revision
app.get("/revision-problems", async (req, res) => {
    try {
        const today = new Date();
        const problems = await Problem.find({
            status: "Solved",
            nextRevision: { $lte: today }
        }).sort({ nextRevision: 1 });

        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark problem reviewed and advance spaced repetition stage
app.put("/review/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        let currentLevel = problem.revisionLevel || 0;
        if (currentLevel < REVISION_INTERVALS.length - 1) {
            currentLevel++;
        }

        problem.revisionLevel = currentLevel;
        problem.nextRevision = calculateNextRevisionDate(currentLevel);

        await problem.save();
        res.json(problem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard stats summary
app.get("/stats", async (req, res) => {
    try {
        const total = await Problem.countDocuments();
        const solved = await Problem.countDocuments({ status: "Solved" });
        const attempted = await Problem.countDocuments({ status: "Attempted" });
        const notStarted = await Problem.countDocuments({ status: "Not Started" });

        res.json({
            total,
            solved,
            attempted,
            notStarted
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accurate daily streak calculation based on unique days
app.get("/streak", async (req, res) => {
    try {
        const solvedProblems = await Problem.find({ status: "Solved" });

        if (solvedProblems.length === 0) {
            return res.json({ streak: 0, activeToday: false });
        }

        // Collect unique calendar days when problems were solved
        const uniqueDates = new Set();
        solvedProblems.forEach(p => {
            const date = p.solvedAt || p.updatedAt;
            if (date) {
                const dateStr = new Date(date).toISOString().split("T")[0];
                uniqueDates.add(dateStr);
            }
        });

        const sortedDates = Array.from(uniqueDates).sort().reverse();
        if (sortedDates.length === 0) {
            return res.json({ streak: 0, activeToday: false });
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const mostRecentDate = sortedDates[0];
        const activeToday = mostRecentDate === todayStr;

        // Streak is broken if most recent solve was before yesterday
        if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
            return res.json({ streak: 0, activeToday: false });
        }

        let streak = 0;
        let expectedDate = new Date(mostRecentDate);

        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const diffDays = Math.round((expectedDate - currentDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }

        res.json({ streak, activeToday });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Progress data for Chart.js
app.get("/progress-data", async (req, res) => {
    try {
        const solvedProblems = await Problem.find({ status: "Solved" });
        const data = {};

        solvedProblems.forEach(p => {
            const date = p.solvedAt || p.updatedAt;
            if (date) {
                const dateStr = new Date(date).toISOString().split("T")[0];
                data[dateStr] = (data[dateStr] || 0) + 1;
            }
        });

        // Sort keys chronologically
        const sortedData = {};
        Object.keys(data).sort().forEach(date => {
            sortedData[date] = data[date];
        });

        res.json(sortedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fallback middleware to serve index.html for frontend routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`DSA JourneyMate Server running on port ${PORT}`);
});
