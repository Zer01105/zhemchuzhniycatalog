	const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const login = "admin";
  const plainPassword = "admin12345";
  const password = await bcrypt.hash(plainPassword, 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "admin" },
  });

  if (existingAdmin) {
    console.log("Admin already exists:", existingAdmin.login);
    return;
  }

  await prisma.user.create({
    data: {
      login,
      password,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`Admin created: ${login} / ${plainPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
