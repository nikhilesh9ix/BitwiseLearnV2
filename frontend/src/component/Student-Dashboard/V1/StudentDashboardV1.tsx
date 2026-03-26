"use client";

import HeroSection from "./HeroSection";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import StudentSideBar from "@/component/general/StudentSidebar";

export default function StudentDashboardV1() {
  const Colors = useColors();
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {/* <SideBar /> */}
      <StudentSideBar />

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto px-10 py-10 ${Colors.background.primary}`}>
        <HeroSection />
      </main>
    </div>
  );
}
