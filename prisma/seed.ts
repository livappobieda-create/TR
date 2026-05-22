/**
 * NEON TRADE — Single-User Database Seed
 * ─────────────────────────────────────────────────────────────
 * Creates (or updates) the ONE authorized user account.
 * Credentials are loaded from .env:
 *   ADMIN_EMAIL    — the authorized login email
 *   ADMIN_PASSWORD — the login password (will be bcrypt-hashed)
 *   ADMIN_USERNAME — display username
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *   npm run db:seed
 *
 * Safe to re-run: uses upsert, will update password if changed.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || "journal";

  if (!email || !password) {
    console.error("❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  console.log(`\n🔐  Seeding single authorized user...`);
  console.log(`    Email:    ${email}`);
  console.log(`    Username: ${username}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
    },
    create: {
      email,
      username,
      passwordHash,
    },
  });

  console.log(`\n✅  User seeded successfully (id: ${user.id})`);
  console.log(`\n    You can now log in at http://localhost:3000/login`);
  console.log(`    Email:    ${email}`);
  console.log(`    Password: [as set in .env]\n`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
