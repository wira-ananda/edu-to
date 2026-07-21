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
  role: "ADMIN" | "TEACHER" | "STUDENT";
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
    email: "teacher@test.com",
    password: "password123",
    name: "Teacher EduTryout",
    role: "TEACHER",
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

async function createOrUpdateAppUser(seedUser: SeedUser) {
  const supabaseUser = await createOrGetSupabaseUser(seedUser);

  const user = await prisma.user.upsert({
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

  return user;
}

async function createSubjectIfNotExists(name: string, ownerId: string | null) {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      name,
      ownerId,
    },
  });

  if (existingSubject) {
    console.log(`Subject already exists: ${name}`);
    return existingSubject;
  }

  const subject = await prisma.subject.create({
    data: {
      name,
      ownerId,
    },
  });

  console.log(`Seeded subject: ${name}`);

  return subject;
}

async function main() {
  const appUsers = await Promise.all(
    users.map((seedUser) => createOrUpdateAppUser(seedUser)),
  );

  const teacher = appUsers.find((user) => user.role === "TEACHER");

  if (!teacher) {
    throw new Error("Teacher user not found");
  }

  for (const subjectName of subjects) {
    await createSubjectIfNotExists(subjectName, teacher.id);
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
