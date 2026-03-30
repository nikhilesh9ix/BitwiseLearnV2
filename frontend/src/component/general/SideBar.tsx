"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  NotebookPen,
  Code2,
  LayoutDashboard,
  ClipboardCheck,
  LogOut,
  LibraryBig,
  Terminal,
} from "lucide-react";
import ThemeSwitcher from "./(Color Manager)/ThemeSwitcher";
import { getColors } from "./(Color Manager)/useColors";
import { useRole } from "./useRole";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/logout";
import useLogs from "@/lib/useLogs";

const MIN_WIDTH = 60;
const MAX_WIDTH = 420;

export default function SideBar() {
  const Colors = getColors();
  const role = useRole();
  const { loading: logsLoading, role: logRole } = useLogs();
  const [width, setWidth] = useState(220);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
  };

  const isCollapsed = width <= 80;

  // Hooks must ALWAYS run
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return;

      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - sidebarLeft;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.classList.remove("select-none");
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = () => {
    isResizing.current = true;
    document.body.classList.add("select-none");
    document.body.style.cursor = "col-resize";
  };

  if (!role) {
    return (
      <aside
        style={{ width }}
        className={`h-full ${Colors.background.primary} ${Colors.border.fadedRight}`}
      >
        <div
          className={`px-4 py-6 text-sm opacity-60 ${Colors.text.secondary}`}
        >
          Loading navigation…
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        style={{ width }}
        className={`fixed top-0 left-0 h-screen
        ${Colors.border.fadedRight}
        ${Colors.background.primary}
        ${Colors.text.primary}
        flex flex-col z-40`}
      >
        {/* Logo */}
        <div className="px-4 py-6 flex justify-center">
          {isCollapsed ? (
            <span className="text-2xl font-bold text-primaryBlue">B</span>
          ) : (
            <h1 className="text-xl font-semibold tracking-wide">
              <span className="text-primaryBlue">B</span>
              itwise <span className="opacity-80">Learn</span>
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          <NavLink
            href={`/admin-dashboard`}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            collapsed={isCollapsed}
          />
          {!logsLoading && logRole != null && logRole < 2 && (
            <NavLink
              href={`/admin-dashboard/courses`}
              icon={<NotebookPen size={20} />}
              label="Courses"
              collapsed={isCollapsed}
            />
          )}
          {!logsLoading && logRole != null && logRole == 4 ? (
            <NavLink
              href={`/problems`}
              icon={<Code2 size={20} />}
              label="Problems"
              collapsed={isCollapsed}
            />
          ) : (
            <NavLink
              href={`/admin-dashboard/problems`}
              icon={<Code2 size={20} />}
              label="Problems"
              collapsed={isCollapsed}
            />
          )}
          {!logsLoading && logRole != null && logRole <= 3 && logRole != 2 && (
            <NavLink
              href={`/admin-dashboard/reports`}
              icon={<ClipboardCheck size={20} />}
              label="Reports"
              collapsed={isCollapsed}
            />
          )}
          {!logsLoading && logRole != null && logRole < 4 && logRole !== 2 && (
            <NavLink
              href={`/admin-dashboard/assessments`}
              icon={<LibraryBig size={20} />}
              label="Assessments"
              collapsed={isCollapsed}
            />
          )}
          <NavLink
            href={`/admin-dashboard/compiler`}
            icon={<Terminal size={20} />}
            label="Compiler"
            collapsed={isCollapsed}
          />
        </nav>

        {/* Footer */}
        <div className="mt-auto px-2 py-4">
          <ThemeSwitcher />
          <button
            onClick={handleLogout}
            className={`
            w-full flex items-center
            ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"}
            py-2.5 rounded-lg
            text-sm font-medium
            ${Colors.text.secondary}
            hover:text-red-400
            hover:bg-red-500/10
            transition-all
            cursor-pointer
            active:scale-95
          `}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primaryBlue/40"
        />
      </aside>

      {/* THIS is the spacer that pushes content */}
      <div style={{ width }} className="shrink-0" />
    </>
  );

  function NavLink({
    href,
    icon,
    label,
    collapsed,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    collapsed: boolean;
  }) {
    const Colors = getColors();

    return (
      <Link href={href} className="block">
        <div
          className={`w-full flex items-center
          ${collapsed ? "justify-center px-2" : "gap-3 px-4"}
          py-2.5 rounded-lg text-sm font-medium
          ${Colors.text.secondary}
          ${Colors.hover.special}
          transition-all`}
        >
          {icon}
          {!collapsed && <span>{label}</span>}
        </div>
      </Link>
    );
  }
}


