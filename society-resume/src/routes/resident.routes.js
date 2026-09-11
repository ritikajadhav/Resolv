const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createComplaint,
  getMyComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  getAllComplaints,
  analyzeComplaintImage,
} = require("../controllers/resident.controller");

// All routes require login
router.use(authenticate);

// 🆕 Analyze image BEFORE submitting — must be defined before /:id routes
router.post("/complaints/analyze", upload.single("image"), analyzeComplaintImage);

// Create a new complaint
router.post("/complaints", upload.single("image"), createComplaint);

// Get all complaints
router.get("/complaints", getAllComplaints);

// Get all complaints of logged-in resident
router.get("/my-complaints", getMyComplaints);

// Get a single complaint by id
router.get("/complaints/:id", getComplaint);

// Update a complaint by id
router.put("/complaints/:id", updateComplaint);

// Delete a complaint by id
router.delete("/complaints/:id", deleteComplaint);

module.exports = router;
