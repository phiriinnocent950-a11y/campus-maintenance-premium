// ==========================================
// CAMPUSCARE MAINTENANCE SYSTEM
// Backend Server
// ==========================================

// Import required packages
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Server port
const PORT = process.env.PORT || 3000;

// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to CampusCare Maintenance API",
        project: "CampusCare",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            records: "/api/records"
        }
    });
});

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "CampusCare API is running successfully"
    });
});

// ==========================================
// 404 ERROR HANDLER
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: "Internal server error."
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusCare API running on port ${PORT}`);
});