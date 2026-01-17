"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/database", label: "Database" },
  { href: "/auth", label: "Auth" },
  { href: "/storage", label: "Storage" },
  { href: "/realtime", label: "Realtime" },
  { href: "/functions", label: "Functions" },
  { href: "/search", label: "Search" },
  { href: "/cron", label: "Cron" },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            isActive(item.href)
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
