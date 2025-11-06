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
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
    },
    LEADER: {
      label: "Leader",
      icon: FaUserTie,
      className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    },
    DEVELOPER: {
      label: "Developer",
      icon: FaCode,
      className:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    },
    DESIGNER: {
      label: "Designer",
      icon: FaPalette,
      className: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
    },
    OBSERVER: {
      label: "Observer",
      icon: FaEye,
      className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
    },
    MEMBER: {
      label: "Member",
      icon: FaUserTie,
      className:
        "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
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
