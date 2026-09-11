require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("./prisma/client");

const ADMIN_EMAIL = "admin@resolv.com";
const ADMIN_PASSWORD = "admin123";

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", password: hashedPassword },
    create: { email: ADMIN_EMAIL, password: hashedPassword, role: "ADMIN" },
  });

  console.log(`✅ Admin account ready:`);
  console.log(`   Email   : ${admin.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role    : ${admin.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
