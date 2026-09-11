const express = require("express");
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require("../controllers/notification.controller");
const authenticate = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
