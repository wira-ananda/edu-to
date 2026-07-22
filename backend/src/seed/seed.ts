import "../lib/env.js";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma.js";
import type { AppRole } from "../types/domain.js";

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
  role: AppRole;
  school?: string | null;
  className?: string | null;
};

const users: SeedUser[] = [
  {
    email: "admin@test.com",
    password: "password123",
    name: "Nadia Prameswari",
    role: "ADMIN",
    school: "EduTryout Indonesia",
    className: null,
  },
  {
    email: "teacher@test.com",
    password: "password123",
    name: "Raka Mahendra",
    role: "TEACHER",
    school: "SMAN 1 Gowa",
    className: null,
  },
  {
    email: "student@test.com",
    password: "password123",
    name: "Alya Putri Ramadhani",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "X IPA 1",
  },
  {
    email: "student2@test.com",
    password: "password123",
    name: "Bima Satriatama",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "X IPA 2",
  },
  {
    email: "student3@test.com",
    password: "password123",
    name: "Citra Nabila Azzahra",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "X IPS 1",
  },
  {
    email: "student4@test.com",
    password: "password123",
    name: "Dimas Aditya Pratama",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "X IPA 3",
  },
  {
    email: "student5@test.com",
    password: "password123",
    name: "Eka Safira Lestari",
    role: "STUDENT",
    school: "SMAN 1 Gowa",
    className: "X IPS 2",
  },
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

async function createOrUpdateSupabaseUser(seedUser: SeedUser) {
  const existingUser = await findSupabaseUserByEmail(seedUser.email);

  if (existingUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: seedUser.password,
        user_metadata: {
          name: seedUser.name,
          role: seedUser.role,
          school: seedUser.school ?? null,
          className: seedUser.className ?? null,
        },
      },
    );

    if (error) {
      throw error;
    }

    return data.user ?? existingUser;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      name: seedUser.name,
      role: seedUser.role,
      school: seedUser.school ?? null,
      className: seedUser.className ?? null,
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

async function createOrUpdateAppUser(seedUser: SeedUser) {
  const supabaseUser = await createOrUpdateSupabaseUser(seedUser);

  const existingUser =
    (await prisma.user.findUnique({
      where: {
        supabaseUserId: supabaseUser.id,
      },
    })) ??
    (await prisma.user.findUnique({
      where: {
        email: seedUser.email,
      },
    }));

  const user = existingUser
    ? await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          supabaseUserId: supabaseUser.id,
          name: seedUser.name,
          email: seedUser.email,
          role: seedUser.role,
          school: seedUser.school ?? null,
          className: seedUser.className ?? null,
        },
      })
    : await prisma.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          name: seedUser.name,
          email: seedUser.email,
          role: seedUser.role,
          school: seedUser.school ?? null,
          className: seedUser.className ?? null,
        },
      });

  console.log(`Seeded ${seedUser.role}: ${seedUser.name} <${seedUser.email}>`);

  return user;
}

async function main() {
  await Promise.all(users.map((seedUser) => createOrUpdateAppUser(seedUser)));

  console.log("Seed users completed.");
  console.log("Subjects are handled by seed-questions.ts.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
