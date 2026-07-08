import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const backendEnvPath = resolve(process.cwd(), ".env");

if (existsSync(backendEnvPath)) {
  config({ path: backendEnvPath });
} else {
  config();
}
