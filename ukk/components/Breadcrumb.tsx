"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaChevronRight } from "react-icons/fa";
import { Fragment } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on homepage/dashboard
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/login") {
    return null;
  }

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/dashboard" },
    ];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Check if segment is a number (ID)
      const isId = /^\d+$/.test(segment);

      if (isId) {
        // Don't add ID segments to breadcrumb
        return;
      }

      // Format label
      let label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Custom labels for specific routes
      const labelMap: { [key: string]: string } = {
        projects: "Projects",
        admin: "Admin",
        users: "User Management",
        settings: "Settings",
        cards: "Cards",
        new: "Create New",
      };

      label = labelMap[segment] || label;

      // Only add href if not the last item
      const isLast =
        index === segments.filter((s) => !/^\d+$/.test(s)).length - 1;

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="border-b bg-muted/50">
      <div className="container mx-auto px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <FaChevronRight className="w-3 h-3 text-muted-foreground/60" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-(--theme-primary) hover:text-(--theme-primary-dark) hover:underline flex items-center gap-1"
                >
                  {index === 0 && <FaHome className="w-3 h-3" />}
                  <span>{crumb.label}</span>
                </Link>
              ) : (
                <span className="text-foreground font-medium flex items-center gap-1">
                  {index === 0 && <FaHome className="w-3 h-3" />}
                  <span>{crumb.label}</span>
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}
