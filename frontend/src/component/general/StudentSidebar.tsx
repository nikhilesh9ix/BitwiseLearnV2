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
  User,
} from "lucide-react";
import { useStudent } from "@/store/studentStore";
import { getColors } from "./(Color Manager)/useColors";
import ThemeSwitcher from "./(Color Manager)/ThemeSwitcher";
import { logoutUser } from "@/lib/logout";
import { useRouter } from "next/navigation";


const MIN_WIDTH = 60;
const MAX_WIDTH = 420;
const Colors = getColors();

export default function StudentSideBar() {
  const [width, setWidth] = useState(220);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const student = useStudent();
  const studentData =
    (student.info as { data?: { name?: string; batch?: { batchname?: string } }; name?: string; batch?: { batchname?: string } } | null)
      ?.data ??
    (student.info as { name?: string; batch?: { batchname?: string } } | null);

  const isCollapsed = width <= 80;

  const router = useRouter();

    const handleLogout = async () => {
      await logoutUser();
      router.replace("/");
    };

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

  return (
    <>
    <aside
      ref={sidebarRef}
      style={{ width }}
      className={`
        fixed top-0 left-0 h-screen
        ${Colors.border.fadedRight}
        ${Colors.background.primary}
        ${Colors.text.primary}
        flex flex-col z-40`}
    >
      {/* PROFILE */}
      <div className={`px-4 pt-6 pb-4 flex flex-col items-center ${Colors.text.primary}`}>
        <div
          className={`h-16 w-16 rounded-full
            ${Colors.background.secondary} flex items-center justify-center
            ${Colors.text.special}`}
        >
          <User size={28} />
        </div>

        {!isCollapsed && (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold">
              {studentData?.name || "Student"}
            </p>
            <p className={`text-xs ${Colors.text.secondary}`}>
              {studentData?.batch?.batchname || ""}
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="px-2 py-4 space-y-1">
        <NavLink
          href="/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          collapsed={isCollapsed}
        />
        <NavLink
          href="/courses"
          icon={<NotebookPen size={20} />}
          label="Courses"
          collapsed={isCollapsed}
        />
        <NavLink
          href="/problems"
          icon={<Code2 size={20} />}
          label="Problems"
          collapsed={isCollapsed}
        />
        <NavLink
          href="/compiler"
          icon={<ClipboardCheck size={20} />}
          label="Compiler"
          collapsed={isCollapsed}
        />
        <NavLink
          href="/assessments"
          icon={<LibraryBig size={20} />}
          label="Assessments"
          collapsed={isCollapsed}
        />
      </nav>


      {/* LOGOUT */}
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
          `}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>

      {/* RESIZE HANDLE */}
      <div
        onMouseDown={startResizing}
        className="
          absolute top-0 right-0 h-full w-1
          cursor-col-resize
          hover:bg-primaryBlue/40
        "
      />
    </aside>
        {/* Spacer */}
    <div style={{ width }} className="shrink-0" />
  </>
  );
}

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
  return (
    <Link href={href} className="block">
      <div
        className={`
          w-full flex items-center
          ${collapsed ? "justify-center px-2" : "gap-3 px-4"}
          py-2.5 rounded-lg
          text-sm font-medium
          ${Colors.text.secondary}
          ${Colors.hover.special}
          ${Colors.text.primary}
          transition-all
        `}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}


