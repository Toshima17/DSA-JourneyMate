//import 
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//mongoose connection
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected Successfully");
})
.catch((err) => {
    console.error("MongoDB Connection Error:", err);
});

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 3
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
        required: true
    },
    logic: {
    type: String,
    default: ""
    },
    tags: {
        type: [String],
        default: []
    },
    nextRevision: {
    type: Date
    },
    revisionLevel: {
    type: Number,
    default: 0
    },
    
},
{ timestamps: true }
);

const Problem = mongoose.model("Problem", problemSchema);

//Routes
app.get("/", (req, res) => {
    res.send("DSA JourneyMate Backend Running");
});
app.get("/hello", (req, res) => {
    res.send("Hello, i'm Toshima Rahangdale");
});
app.get("/about", (req, res) => {
    res.send("This is PrepSATI AI backend");
});
app.get("/test", (req, res) => {
    res.send("Testing route works");
});

app.post("/add-problem", async (req, res) => {
    try {
        const { title, difficulty, link, logic, tags } = req.body;
        const intervals = [1,3,7,14,30];

        const firstRevision = new Date();
        firstRevision.setDate(firstRevision.getDate() + intervals[0]);

        const newProblem = await Problem.create({
        title,
        difficulty,
        link,
        logic,
        tags,
        nextRevision: firstRevision,
        revisionLevel: 0
        });

        res.json(newProblem);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/problems", async (req, res) => {
    const { difficulty } = req.query;
    let filter = {};
    if (difficulty) {
        filter.difficulty = difficulty;
    }
    const problems = await Problem.find(filter);
    res.json(problems);

});

//delete 
app.delete("/delete-problem/:id", async (req, res) => {
    try {
        await Problem.findByIdAndDelete(req.params.id);
        res.json({ message: "Problem deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/update-problem/:id", async (req, res) => {
    try {
        const { title, difficulty, logic, tags } = req.body;

        const updatedProblem = await Problem.findByIdAndUpdate(
            req.params.id,
            { title, difficulty, logic, tags },
            { new: true, runValidators: true }
        );

        res.json(updatedProblem);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

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
            const intervals = [1,3,7,14,30];
            let level = problem.revisionLevel + 1;

            if (level >= intervals.length) {
                level = intervals.length - 1;
            }

            const nextRevision = new Date();
            nextRevision.setDate(nextRevision.getDate() + intervals[level]);

            problem.revisionLevel = level;
            problem.nextRevision = nextRevision;

        } else {
            problem.nextRevision = null;

        }
        await problem.save();
        res.json(problem);

    }   catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.patch("/update-attempt/:id", async (req, res) => {

    try {
        const { id } = req.params;
        const updatedProblem = await Problem.findByIdAndUpdate(
        id,
        { status: "Attempted" },
        { new: true }
        );
        res.json(updatedProblem);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});

app.get("/revision-problems", async (req, res) => {

    const today = new Date();

    const problems = await Problem.find({
        nextRevision: { $lte: today }
    });

    res.json(problems);

});

app.get("/stats", async (req, res) => {

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

});

app.get("/streak", async (req, res) => {

    try{
        const solvedProblems = await Problem.find({ status: "Solved" })
        .sort({ updatedAt: -1 });

        if(solvedProblems.length === 0){
            return res.json({ streak: 0 });
        }

        let streak = 1;

        for(let i = 1; i < solvedProblems.length; i++){
            const prev = new Date(solvedProblems[i-1].updatedAt);
            const curr = new Date(solvedProblems[i].updatedAt);
            const diff = (prev - curr) / (1000 * 60 * 60 * 24);

            if(diff <= 1){
                streak++;
            }else{
                break;
            }
        }
        res.json({ streak });

        }catch(err){
        res.status(500).json({ error: err.message });
    }

});

app.get("/progress-data", async (req, res) => {
    try {
        const solvedProblems = await Problem.find({ status: "Solved" });
        const data = {};
        solvedProblems.forEach(problem => {

            const date = problem.updatedAt
            .toISOString()
            .split("T")[0];

            data[date] = (data[date] || 0) + 1;

        });
        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/review/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        const intervals = [1, 3, 7, 14, 30];

        let currentStage = problem.revisionStage || 0;

        if (currentStage < intervals.length - 1) {
            currentStage++;
        }

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervals[currentStage]);

        problem.revisionStage = currentStage;
        problem.nextRevision = nextDate;

        await problem.save();

        res.json(problem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//listen
app.listen(3000, () => {
    console.log("Server running on port 3000");
});