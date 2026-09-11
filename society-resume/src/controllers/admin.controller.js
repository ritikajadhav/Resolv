const prisma = require("../../prisma/client");
const { sendStatusChangedEmail } = require("../services/email.service");

// Get all complaints (admin)
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update complaint status (admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { user: { select: { id: true, email: true } } },
    });

    // Send email + create in-app notification (non-blocking)
    const statusLabel = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" }[status] || status;
    const notifBody = `Your complaint "${complaint.title}" (#${complaint.id}) status has been updated to ${statusLabel}.`;

    Promise.all([
      sendStatusChangedEmail(complaint.user.email, complaint, status),
      prisma.notification.create({
        data: {
          userId: complaint.user.id,
          title: "Status Updated",
          body: notifBody,
        },
      }),
    ]).catch((err) => console.error("Notification side-effect error:", err));

    res.status(200).json({ message: "Complaint status updated", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (never return password)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }, // password excluded
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add comment to any complaint
const addNote = async (req, res) => {
  const { complaintId, content } = req.body;
  if (!complaintId || !content?.trim()) {
    return res.status(400).json({ message: "complaintId and content are required" });
  }
  try {
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(complaintId) },
      data: { notes: content.trim() },
    });
    res.status(200).json({ message: "Note saved", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single complaint
const getComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.status(200).json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a complaint
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.complaint.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Complaint deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user role (promote/demote)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["ADMIN", "RESIDENT"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'ADMIN' or 'RESIDENT'" });
    }

    const targetUserId = parseInt(id, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Safety guard: prevent an admin from demoting their own logged-in account
    if (req.user.id === targetUserId && role !== "ADMIN") {
      return res.status(400).json({ message: "You cannot demote your own admin account" });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, email: true, role: true, name: true, lastName: true },
    });

    res.status(200).json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllComplaints,
  updateComplaintStatus,
  getAllUsers,
  addNote,
  getComplaint,
  deleteComplaint,
  updateUserRole,
};