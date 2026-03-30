"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type EntityData = {
  id: string;
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type Props = {
  data: EntityData[];
};

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

function DashboardInfo({ data }: Props) {
  const router = useRouter();
  const Colors = getColors();

  const handleSeeDetails = (institutionId: string) => {
    router.push(`/admin-dashboard/institutions/${institutionId}`);
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={`py-12 mt-12 text-center text-sm ${Colors.text.secondary}`}>
        No data available
      </div>
    );
  }

  return (
    <>
      {/* Table Container */}
      <div
        className={`mx-auto max-w-6xl w-full overflow-y-auto overflow-x-hidden ${Colors.border.fadedThick} ${Colors.background.secondary} shadow-lg`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          //@ts-ignore
          WebkitScrollbar: { display: "none" },
        }}
      >
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className={`${Colors.background.primary}`}>
            <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${Colors.text.secondary}`}>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-white/5">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`text-sm ${Colors.text.primary} transition-colors ${Colors.hover.special}`}
              >
                <td className="px-6 py-4 font-medium truncate">
                  {item.name || "Unnamed"}
                </td>

                <td className={`px-6 py-4 truncate ${Colors.text.secondary}`}>
                  {item.email || "—"}
                </td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                  {formatDate(item.createdAt)}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSeeDetails(item.id)}
                    className="rounded-md border border-primaryBlue/40 px-3 py-1.5 text-xs font-medium text-primaryBlue transition hover:bg-primaryBlue/20 cursor-pointer"
                  >
                    See details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default DashboardInfo;


