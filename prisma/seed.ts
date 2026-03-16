import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists (${email}), ensuring ADMIN role...`);
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log('Done.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log(`Admin user created: ${email}`);
  console.log('Change this password after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
