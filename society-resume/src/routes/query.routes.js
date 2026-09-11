const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/auth.middleware");
const permit = require("../middlewares/permit");
const { naturalLanguageQuery } = require("../controllers/query.controller");

// Only admins can use the natural language query feature
router.use(authenticate);
router.use(permit("ADMIN"));

// POST /api/query
// Body: { "question": "how many open complaints are there?" }
router.post("/", naturalLanguageQuery);

module.exports = router;
