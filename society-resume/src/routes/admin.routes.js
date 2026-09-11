const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const permit = require("../middlewares/permit");
const {
  getAllComplaints,
  getAllUsers,
  getComplaint,
  updateComplaintStatus,
  deleteComplaint,
  addNote,
  updateUserRole,
} = require("../controllers/admin.controller");

//getAllComplaints, updateComplaintStatus,
  //  getAllUsers, addComment, getComplaint, deleteComplaint
 
// All routes require login + admin role
router.use(authenticate);
router.use(permit("ADMIN"));

//get all complaints
router.get("/complaints", getAllComplaints);
// Get all users
router.get("/users", getAllUsers);
// Update user role (promote/demote)
router.patch("/users/:id/role", updateUserRole);

// Get a single complaint by id
router.get("/complaints/:id", getComplaint);

// Update complaint status
router.patch("/complaints/:id", updateComplaintStatus);

// Delete a complaint
router.delete("/complaints/:id", deleteComplaint);

// Add a comment to a complaint
router.post("/notes", addNote);

module.exports = router;
