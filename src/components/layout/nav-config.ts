import type { LucideIcon } from "lucide-react";
import {
  Activity as ActivityIcon,
  BarChart3,
  BookOpen,
  Home,
  Library,
  Play,
  Settings,
  Trophy,
  Tv,
} from "lucide-react";

export interface AppNavItem {
  path: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
}

export interface AppNavSection {
  title: string;
  items: AppNavItem[];
}

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    title: "Main",
    items: [
      { path: "/", label: "Home", mobileLabel: "Home", icon: Home },
      { path: "/continue", label: "Continue", icon: Play },
    ],
  },
  {
    title: "Library",
    items: [
      { path: "/anime", label: "Anime Archive", mobileLabel: "Library", icon: Tv },
      { path: "/manga", label: "Manga Library", icon: BookOpen },
    ],
  },
  {
    title: "Discover",
    items: [
      { path: "/tier-maker", label: "Tier Ranking", mobileLabel: "Tier", icon: Trophy },
      { path: "/activity", label: "Interaction", mobileLabel: "Activity", icon: ActivityIcon },
    ],
  },
  {
    title: "Analytics",
    items: [{ path: "/stats", label: "Intelligence", mobileLabel: "Stats", icon: BarChart3 }],
  },
  {
    title: "System",
    items: [{ path: "/settings", label: "Protocols", icon: Settings }],
  },
];

export const MOBILE_NAV_ITEMS: AppNavItem[] = [
  APP_NAV_SECTIONS[0].items[0],
  { path: "/anime", label: "Anime Archive", mobileLabel: "Library", icon: Library },
  APP_NAV_SECTIONS[2].items[0],
  APP_NAV_SECTIONS[3].items[0],
  APP_NAV_SECTIONS[2].items[1],
];
