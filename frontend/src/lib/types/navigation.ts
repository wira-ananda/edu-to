export type AppNavIcon =
  | "dashboard"
  | "book-open"
  | "plus-circle"
  | "activity"
  | "file-text"
  | "settings"
  | "play-circle"
  | "history"
  | "trophy"
  | "user";

export type AppNavItem = {
  label: string;
  href: string;
  icon: AppNavIcon;
};

export type AppNavGroup = {
  label: string;
  items: AppNavItem[];
};
