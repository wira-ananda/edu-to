import "../lib/env.js";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "STUDENT";
  school?: string;
  className?: string;
};

const users: SeedUser[] = [
  {
    email: "admin@test.com",
    password: "password123",
    name: "Admin EduTryout",
    role: "ADMIN",
    school: "SMAN 1 Gowa",
  },
  {
    email: "student@test.com",
    password: "password123",
    name: "Siswa Test",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "XII IPA 1",
  },
];

const subjects = [
  "Biologi",
  "Matematika",
  "Fisika",
  "Kimia",
  "Bahasa Indonesia",
];

async function findSupabaseUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email === email) ?? null;
}

async function createOrGetSupabaseUser(seedUser: SeedUser) {
  const existingUser = await findSupabaseUserByEmail(seedUser.email);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      name: seedUser.name,
      role: seedUser.role,
      school: seedUser.school,
      className: seedUser.className,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(`Failed to create Supabase user: ${seedUser.email}`);
  }

  return data.user;
}

async function main() {
  for (const subjectName of subjects) {
    await prisma.subject.upsert({
      where: {
        name: subjectName,
      },
      update: {},
      create: {
        name: subjectName,
      },
    });

    console.log(`Seeded subject: ${subjectName}`);
  }

  for (const seedUser of users) {
    const supabaseUser = await createOrGetSupabaseUser(seedUser);

    await prisma.user.upsert({
      where: {
        supabaseUserId: supabaseUser.id,
      },
      update: {
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        school: seedUser.school,
        className: seedUser.className,
      },
      create: {
        supabaseUserId: supabaseUser.id,
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        school: seedUser.school,
        className: seedUser.className,
      },
    });

    console.log(`Seeded ${seedUser.role}: ${seedUser.email}`);
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
