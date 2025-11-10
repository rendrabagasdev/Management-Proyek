import { Badge } from "@/components/ui/badge";
import {
  FaUserShield,
  FaUserTie,
  FaCode,
  FaPalette,
  FaEye,
} from "react-icons/fa";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function RoleBadge({
  role,
  size = "md",
  showIcon = true,
}: RoleBadgeProps) {
  const roleConfig = {
    ADMIN: {
      label: "Admin",
      icon: FaUserShield,
      className:
        "bg-(--theme-danger) bg-opacity-10 text-(--theme-danger) border-(--theme-danger) border-opacity-30 hover:bg-(--theme-danger) hover:bg-opacity-20",
    },
    LEADER: {
      label: "Leader",
      icon: FaUserTie,
      className:
        "bg-(--theme-primary) bg-opacity-10 text-(--theme-primary) border-(--theme-primary) border-opacity-30 hover:bg-(--theme-primary) hover:bg-opacity-20",
    },
    DEVELOPER: {
      label: "Developer",
      icon: FaCode,
      className:
        "bg-(--theme-success) bg-opacity-10 text-(--theme-success) border-(--theme-success) border-opacity-30 hover:bg-(--theme-success) hover:bg-opacity-20",
    },
    DESIGNER: {
      label: "Designer",
      icon: FaPalette,
      className:
        "bg-(--theme-accent) bg-opacity-10 text-(--theme-accent) border-(--theme-accent) border-opacity-30 hover:bg-(--theme-accent) hover:bg-opacity-20",
    },
    OBSERVER: {
      label: "Observer",
      icon: FaEye,
      className:
        "bg-muted text-muted-foreground border-border hover:bg-muted/80",
    },
    MEMBER: {
      label: "Member",
      icon: FaUserTie,
      className:
        "bg-(--theme-secondary) bg-opacity-10 text-(--theme-secondary) border-(--theme-secondary) border-opacity-30 hover:bg-(--theme-secondary) hover:bg-opacity-20",
    },
  };

  const config =
    roleConfig[role as keyof typeof roleConfig] || roleConfig.MEMBER;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], "font-medium")}
    >
      {showIcon && <Icon className="mr-1.5 inline" />}
      {config.label}
    </Badge>
  );
}
