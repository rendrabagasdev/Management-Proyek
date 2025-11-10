"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/RoleBadge";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings } from "@/components/SettingsProvider";
import {
  FaUser,
  FaSignOutAlt,
  FaTasks,
  FaChartBar,
  FaProjectDiagram,
  FaUserCog,
  FaPlus,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const userRole = session.user.role;

  // Define navigation links based on role
  const getNavLinks = () => {
    const baseLinks = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: FaChartBar,
        roles: ["ADMIN", "LEADER", "MEMBER"],
      },
      {
        href: "/projects",
        label: "Projects",
        icon: FaProjectDiagram,
        roles: ["ADMIN", "LEADER", "MEMBER"],
      },
    ];

    const adminLinks = [
      {
        href: "/admin",
        label: "Admin Panel",
        icon: FaUserCog,
        roles: ["ADMIN"],
      },
    ];

    let links = [...baseLinks];

    // Add role-specific links
    if (userRole === "ADMIN") {
      links = [...links, ...adminLinks];
    }

    return links.filter((link) => link.roles.includes(userRole));
  };

  const navLinks = getNavLinks();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="p-2 bg-(--theme-primary) rounded-lg">
              <FaTasks className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">
              {settings.app_name || "UKK Project"}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "space-x-2",
                      isActive &&
                        "bg-(--theme-primary) text-white hover:bg-(--theme-primary-dark)"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <NotificationBell />
            <RoleBadge role={session.user.role} size="sm" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="space-x-2">
                  <div className="w-8 h-8 bg-(--theme-primary) rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="hidden lg:inline">{session.user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Quick Links */}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <FaChartBar className="mr-2 w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/projects" className="cursor-pointer">
                    <FaProjectDiagram className="mr-2 w-4 h-4" />
                    <span>My Projects</span>
                  </Link>
                </DropdownMenuItem>

                {userRole === "ADMIN" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/projects/new" className="cursor-pointer">
                        <FaPlus className="mr-2 w-4 h-4" />
                        <span>Create Project</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <FaUserCog className="mr-2 w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="cursor-pointer"
                >
                  <FaSignOutAlt className="mr-2 w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <NotificationBell />
            <RoleBadge role={session.user.role} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {/* User Info */}
            <div className="px-4 py-2 bg-muted rounded-lg mb-3">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>

            {/* Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-(--theme-primary) text-white"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Sign Out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-muted w-full text-left text-(--theme-danger)"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
