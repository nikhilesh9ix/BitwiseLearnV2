"use client";

import SideBar from "@/component/general/SideBar";
import HeroSection from "./HeroSection";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function TeacherDashboardV1() {
  const Colors = getColors();
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto px-10 py-10 ${Colors.background.primary}`}>
        <HeroSection />
      </main>
    </div>
  );
}


