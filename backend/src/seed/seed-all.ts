const seedFiles = [
  // Seeder akun wajib pertama.
  "src/seed/seed-user.ts",

  // Seeder bank soal dan tryout setelah akun tersedia.
  "src/seed/seed-biologi-kelas-10.ts",
  //   "src/seed/seed-demo-progress.ts",
  //   "src/seed/seed-questions.ts",
];

async function runSeed(seedFile: string) {
  console.log("");
  console.log(`Running ${seedFile}...`);

  const child = Bun.spawn(["bun", seedFile], {
    cwd: process.cwd(),
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(`Seeder ${seedFile} gagal dengan exit code ${exitCode}.`);
  }

  console.log(`Completed ${seedFile}`);
}

async function main() {
  console.log("Starting all seeders...");

  for (const seedFile of seedFiles) {
    await runSeed(seedFile);
  }

  console.log("");
  console.log("All seeders completed.");
}

main().catch((error) => {
  console.error("");
  console.error("Failed to run all seeders:", error);
  process.exit(1);
});
