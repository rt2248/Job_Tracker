require("dotenv").config();

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
const listingsRoutes = require("./routes/listings.routes");
const settingsRoutes = require("./routes/settings.routes");
const resumeRoutes = require("./routes/resume.routes");
const profileRoutes = require("./routes/profile.routes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/profile", profileRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port:${process.env.PORT || 5000}`);
});
