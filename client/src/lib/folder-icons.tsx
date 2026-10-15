import {
  Inbox,
  Clock,
  Folder,
  Star,
  Heart,
  Bookmark,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Palette,
  type LucideIcon,
} from "lucide-react";

export const FOLDER_ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  clock: Clock,
  folder: Folder,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  lightbulb: Lightbulb,
  palette: Palette,
};

export function getFolderIcon(name: string): LucideIcon {
  return FOLDER_ICONS[name] ?? Folder;
}
