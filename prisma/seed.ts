import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@trailblazer.local';
  const password = 'Admin123!@#secure';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists (${email}), updating role to ADMIN...`);
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
      emailVerified: new Date(), // skip email verification
    },
  });

  console.log('Admin user created:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('  Change this password after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
