const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const login = "admin";
  const password = "admin123";

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { login },
    update: {
      password: hash,
      role: "admin",
      isActive: true,
    },
    create: {
      login,
      password: hash,
      role: "admin",
      isActive: true,
    },
  });

  console.log("Admin ready:");
  console.log("login:", login);
  console.log("password:", password);
  console.log("id:", user.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
