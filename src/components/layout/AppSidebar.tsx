"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  Star,
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  Calendar,
  Settings,
  Plug,
  Globe,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { apiFetch } from "@/lib/api";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  exact?: boolean;
  requiresBooking?: boolean;
};

const navItems: NavItem[] = [
  { name: "Overview", icon: <LayoutGrid />, path: "/" },
  { name: "Conversations", icon: <MessageSquare />, path: "/conversations", exact: true },
  { name: "Reviews", icon: <Star />, path: "/conversations/reviews" },
  { name: "Channels", icon: <Plug />, path: "/channels" },
  { name: "Website Widget", icon: <Globe />, path: "/customize-chat" },
  { name: "Leads", icon: <Users />, path: "/leads" },
  { name: "Knowledge", icon: <BookOpen />, path: "/faq" },
  { name: "Analytics", icon: <BarChart3 />, path: "/analytics" },
  { name: "Growth", icon: <TrendingUp />, path: "/growth" },
  { name: "Bookings", icon: <Calendar />, path: "/availability", requiresBooking: true },
  { name: "Settings", icon: <Settings />, path: "/settings" },
];

type MeResp = { tenant: { booking_enabled: boolean } | null };

export function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [bookingEnabled, setBookingEnabled] = useState(false);

  useEffect(() => {
    apiFetch<MeResp>("/admin/profile/me", { auth: true })
      .then((me) => setBookingEnabled(!!me.tenant?.booking_enabled))
      .catch(() => {});
  }, []);

  const isActive = useCallback(
    (item: NavItem) =>
      item.path === "/"
        ? pathname === "/"
        : item.exact
          ? pathname === item.path
          : pathname.startsWith(item.path),
    [pathname]
  );

  const items = navItems.filter((item) => !item.requiresBooking || bookingEnabled);
  const showLabel = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 z-50 h-screen border-r border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-[var(--app-sidebar-text)] transition-all duration-300 ease-in-out
        ${isMobileOpen ? "w-[290px]" : isExpanded || isHovered ? "w-[240px] xl:w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/lashvaelogo.png" alt="Lashvae" width={showLabel ? 36 : 32} height={showLabel ? 36 : 32} />
          {showLabel && (
            <span className="type-card-title font-semibold tracking-wide text-[var(--app-sidebar-text)]">
              LASHVAE AI
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`menu-item group ${isActive(item) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={isActive(item) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    {item.icon}
                  </span>
                  {showLabel && <span className="menu-item-text">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
