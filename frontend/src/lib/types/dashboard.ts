export type DashboardCardTone = "default" | "blue" | "green" | "yellow" | "red";

export type DashboardCard = {
  label: string;
  value: string | number;
  description?: string;
  tone?: DashboardCardTone;
};

export type DashboardAction = {
  title: string;
  description: string;
  href: string;
  label?: string;
  primary?: boolean;
};
