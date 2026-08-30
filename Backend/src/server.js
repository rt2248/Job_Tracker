const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Connection Successfull!!!" });
});

// Import routes
const authRoutes = require("./routes/auth.routes");
const jobsRoutes = require("./routes/jobs.routes");
// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
});