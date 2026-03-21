"use client";

import { User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProblemSubmissionForm from "./ProblemSubmissionForm";
import { getAllProblemCount } from "@/api/problems/get-problem-count";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import { useRole } from "@/component/general/useRole";
import useLogs from "@/lib/useLogs";
import useVendor from "@/store/vendorStore";
import { useInstitution } from "@/store/institutionStore";
import { useAdmin } from "@/store/adminStore";
import { useTeacher } from "@/store/teacherStore";

type ProblemCount = {
  easy: number;
  medium: number;
  hard: number;
  totalQuestion: number;
};

function DashboardHero() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="w-full px-6 pt-6">
      <HeroSection showForm={showForm} setShowForm={setShowForm} />
    </div>
  );
}

export default DashboardHero;

function HeroSection({
  showForm,
  setShowForm,
}: {
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const Colors = useColors();
  const { loading: logsLoading, role: logRole } = useLogs();
  const role = useRole();

  const { info: adminInfo } = useAdmin();
  const { info: vendorInfo } = useVendor();
  const { info: institutionInfo } = useInstitution();
  const { info: teacherInfo } = useTeacher();

  const [data, setData] = useState<ProblemCount | null>(null);

  const adminDetails = useMemo(() => {
    if (logsLoading || logRole === null) {
      return { name: "", email: "" };
    }

    switch (logRole) {
      case 0:
      case 1:
        return adminInfo
          ? { name: adminInfo.data.name, email: adminInfo.data.email }
          : { name: "", email: "" };
      case 2:
        return vendorInfo
          ? { name: vendorInfo.data.name, email: vendorInfo.data.email }
          : { name: "", email: "" };
      case 3:
        return institutionInfo?.data
          ? {
              name: institutionInfo.data.name,
              email: institutionInfo.data.email,
            }
          : { name: "", email: "" };
      case 4:
        return teacherInfo?.data
          ? { name: teacherInfo.data.name, email: teacherInfo.data.email }
          : { name: "", email: "" };
      default:
        return { name: "", email: "" };
    }
  }, [
    logsLoading,
    logRole,
    adminInfo,
    vendorInfo,
    institutionInfo,
    teacherInfo,
  ]);

  useEffect(() => {
    getAllProblemCount(setData);
  }, []);

  return (
    <div
      className={`w-full rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between ${Colors.background.secondary} shadow-sm`}
    >
      {showForm && <ProblemSubmissionForm setOpen={setShowForm} />}

      {/* LEFT */}
      <div className="text-center md:text-left space-y-4">
        <h1 className="text-4xl font-semibold">
          <span className={`${Colors.text.special}`}>Greetings,</span>{" "}
          <span className={`${Colors.text.primary}`}>
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
          </span>
        </h1>

        <p className={`${Colors.text.primary} text-lg`}>
          Enjoy managing{" "}
          <span className={`${Colors.text.special} font-semibold`}>
            Bitwise Learn
          </span>
        </p>

        <p
          className={`${Colors.text.primary} max-w-lg text-base leading-relaxed`}
        >
          Want to <span className="font-medium">add a new question</span> or{" "}
          <span className="font-medium">update an existing one</span>? Select an
          option below to continue.
        </p>

        {!logsLoading && logRole != null && logRole < 4 && (
          <button
            onClick={() => setShowForm(true)}
            className={`${Colors.background.special} mt-6 ${Colors.text.primary} px-6 py-3 rounded-lg font-medium shadow-md hover:opacity-90`}
          >
            Add New Question
          </button>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-center gap-4 mt-8 md:mt-0">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center">
          <User size={30} className="text-black" />
        </div>

        <div className={`${Colors.text.primary} text-center`}>
          <h2 className={` ${Colors.text.primary} text-xl font-medium`}>
            {adminDetails.name}
          </h2>
          <p className={`${Colors.text.secondary} text-sm opacity-90`}>
            {adminDetails.email}
          </p>
        </div>

        {/* STATS */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard label="Easy" value={data.easy} color="green" />
            <StatCard label="Medium" value={data.medium} color="yellow" />
            <StatCard label="Hard" value={data.hard} color="red" />
            <StatCard
              label="Total Questions"
              value={data.totalQuestion}
              color="blue"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "yellow" | "red" | "blue";
}) {
  const colorMap = {
    green: "text-green-400 bg-green-400/10",
    yellow: "text-yellow-400 bg-yellow-400/10",
    red: "text-red-400 bg-red-400/10",
    blue: "text-blue-400 bg-blue-400/10",
  };

  return (
    <div
      className={`rounded-lg px-4 py-3 border border-white/10 ${colorMap[color]}`}
    >
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
