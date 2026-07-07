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
  badge?: string;
};

export type AppNavGroup = {
  title: string;
  items: AppNavItem[];
};
