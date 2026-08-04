import { UserRole } from '@prisma/client';
import { prisma } from '../shared/db/prisma.js';

const [email, rawRole = 'ADMIN'] = process.argv.slice(2);
const role = UserRole[rawRole as keyof typeof UserRole];

if (!email || !role) {
  console.error('Usage: npm run user:promote -- <email> [ADMIN|AGENT|CUSTOMER]');
  process.exitCode = 1;
} else {
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    console.info(`Updated ${user.email} to ${user.role}`);
  } catch {
    console.error(`User not found: ${email}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
