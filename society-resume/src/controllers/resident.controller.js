const fs = require("fs");
const prisma = require("../../prisma/client");
const { Status } = require("@prisma/client");
const {
  categorizeComplaint,
  checkDuplicate,
  suggestResponse,
  analyzeImage,
} = require("../services/ai.service");
const { sendComplaintSubmittedEmail } = require("../services/email.service");

// Analyze image before submission (human-in-the-loop step 1)
const analyzeComplaintImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required for analysis" });
    }

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Read the uploaded file and convert to base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype;

    const analysis = await analyzeImage(imageBase64, mimeType, title, description);

    // Clean up temp file after reading
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: "Image analyzed successfully",
      analysis,
      prompt: "Does this match your complaint? You can confirm or change the category before submitting.",
    });
  } catch (err) {
    console.error("Image analysis error:", err);
    res.status(500).json({ message: "Server error during image analysis" });
  }
};

// Create a complaint (human-in-the-loop step 2)
const createComplaint = async (req, res) => {
  try {
    const { title, description, location, confirmedCategory } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Description is required" });
    }

    // Step 1: Check for duplicates
    const openComplaints = await prisma.complaint.findMany({
      where: { status: "OPEN" },
      select: { id: true, title: true, description: true, location: true },
    });

    const duplicateCheck = await checkDuplicate(title, description, location, openComplaints);
    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        message: "A similar complaint is already open for this location.",
        duplicateId: duplicateCheck.duplicateId,
      });
    }

    // Step 2: Categorize complaint
    const { category: aiCategory, priority } = await categorizeComplaint(title, description);

    // Use confirmed category from image analysis if resident approved it
    // otherwise fall back to text-based AI category
    const finalCategory = confirmedCategory || aiCategory;

    // Step 3: Suggested admin response
    const suggestedResponse = await suggestResponse(title, description, finalCategory, priority);

    // Step 4: Save complaint
    const complaint = await prisma.complaint.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        location: location ? location.trim() : null,
        status: Status.OPEN,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        userId: req.user.id,
        category: finalCategory,
        priority,
      },
    });

    // Step 5: Send email + create in-app notification (non-blocking)
    const notifTitle = "Complaint Received";
    const notifBody = `Your complaint "${complaint.title}" (#${complaint.id}) has been submitted and is now open.`;

    // Fetch user email if not in JWT (e.g. existing token sessions)
    let userEmail = req.user.email;
    if (!userEmail) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { email: true },
      });
      userEmail = userRecord?.email;
    }

    Promise.all([
      userEmail ? sendComplaintSubmittedEmail(userEmail, complaint) : Promise.resolve(),
      prisma.notification.create({
        data: {
          userId: req.user.id,
          title: notifTitle,
          body: notifBody,
        },
      }),
    ]).catch((err) => console.error("Notification side-effect error:", err));

    res.status(201).json({
      message: "Complaint created",
      complaint,
      suggestedResponse,
    });
  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all complaints of logged-in user
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ complaints });
  } catch (err) {
    console.error("Get complaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ complaints });
  } catch (err) {
    console.error("Get all complaints error:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// Update own complaint (only if OPEN)
const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { title, description, location } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!description || description.trim() === "") {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const existing = await prisma.complaint.findFirst({
      where: { id: Number(id), userId: req.user.id },
    });

    if (!existing) return res.status(404).json({ message: "Complaint not found" });
    if (existing.status !== "OPEN") return res.status(403).json({ message: "Only OPEN complaints can be edited" });

    const { category, priority } = await categorizeComplaint(title, description);

    const complaint = await prisma.complaint.update({
      where: { id: Number(id) },
      data: {
        title: title.trim(),
        description: description.trim(),
        location: location ? location.trim() : existing.location,
        category,
        priority,
      },
    });

    res.json({ message: "Complaint updated", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete own complaint
const deleteComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.complaint.findFirst({
      where: { id: Number(id), userId: req.user.id },
    });

    if (!existing) return res.status(404).json({ message: "Complaint not found" });

    await prisma.complaint.delete({ where: { id: Number(id) } });
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single complaint
const getComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: Number(id), userId: req.user.id },
    });
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  analyzeComplaintImage,
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
  getComplaint,
};
