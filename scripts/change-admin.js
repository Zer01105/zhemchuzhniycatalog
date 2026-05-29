const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const login = "Zer01105";
  const password = "D635685635685d";

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      login: "admin",
    },
    data: {
      login,
      password: hash,
    },
  });

  console.log("updated");
}

main();
