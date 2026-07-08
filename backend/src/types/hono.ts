import type { AppUser } from "./domain.js";

export type AppEnv = {
  Variables: {
    user: AppUser;
  };
};
