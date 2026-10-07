const { PrismaClient } = require("@prisma/client");
// Omit the 384-float embedding from API responses by default; it is only
// read explicitly (via `select`) by the duplicate-detection service.
const prisma = new PrismaClient({
  omit: { complaint: { embedding: true } },
});
module.exports = prisma;
