// permit.js
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role; // set by authenticate middleware

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
  };
};

module.exports = permit;
