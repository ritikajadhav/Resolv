require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());


// basic test route
app.get("/", (req, res) => {
  res.send("Server is working!");
});

const authRoutes = require("./routes/auth.routes");
const residentRoutes = require("./routes/resident.routes");
const adminRoutes = require("./routes/admin.routes");
const queryRoutes = require("./routes/query.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use("/api/auth", authRoutes);
app.use("/api/resident", residentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

module.exports = app;

