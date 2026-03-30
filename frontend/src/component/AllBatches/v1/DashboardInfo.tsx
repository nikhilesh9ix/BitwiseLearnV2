"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type BatchData = {
  id: string;
  batchname: string;
  branch: string;
  batchEndYear: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  data: BatchData[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function DashboardInfo({ data }: Props) {
  const router = useRouter();
  const Colors = getColors();

  const handleSeeDetails = (batchId: string) => {
    router.push(`/admin-dashboard/batches/${batchId}`);
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-white/50">
        No batches found
      </div>
    );
  }

  return (
    <>
      {/* Table */}
      <div
        className={`w-full overflow-y-auto border ${Colors.border.defaultThick} ${Colors.background.primary} shadow-lg rounded-lg`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          //@ts-ignore
          WebkitScrollbar: { display: "none" },
        }}
      >
        <table className="w-full border-collapse">
          <thead className={`${Colors.background.secondary}`}>
            <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${Colors.text.primary}`}>
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4">End Year</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {data.map((batch) => (
              <tr
                key={batch.id}
                className={`text-sm ${Colors.text.primary} transition hover:bg-primaryBlue/10 ${Colors.border.default}`}
              >
                <td className={`px-6 py-4 font-medium ${Colors.text.secondary}`}>{batch.batchname}</td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>{batch.branch}</td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                  {batch.batchEndYear}
                </td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                  {formatDate(batch.createdAt)}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSeeDetails(batch.id)}
                    className={`rounded-md border ${Colors.border.specialThick} px-3 py-1.5 text-xs font-medium ${Colors.text.special} transition ${Colors.hover.special} cursor-pointer active:scale-95`}
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


