"use client";

import { getAllAssessments } from "@/api/assessments/get-all-assessments";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  CalendarClock,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import Link from "next/link";
import { handleReport } from "@/api/reports/get-full-report";
import toast from "react-hot-toast";

type Assessment = {
  id: string;
  name: string;
  description: string;
  instruction: string;
  startTime: string;
  endTime: string;
  individualSectionTimeLimit: number | null;
  status: "UPCOMING" | "ONGOING" | "ENDED";
  batchId: string;
  reportStatus: "NOT_REQUESTED" | "PROCESSING" | "PROCESSED";
  report?: string | null;
};

function AllAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Assessment["status"]>("all");

  const router = useRouter();
  const Colors = getColors();

  useEffect(() => {
    async function handleLoad() {
      setLoading(true);
      const data = await getAllAssessments();
      setAssessments(data || []);
      setLoading(false);
    }
    handleLoad();
  }, []);
  async function handleReportRequest(id: string) {
    const toastId = toast.loading("Requesting...");

    try {
      await handleReport(id);
      toast.success("Done!", { id: toastId });
    } catch (err) {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      window.location.reload();
    }
  }

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        assessment.name.toLowerCase().includes(search.toLowerCase()) ||
        assessment.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || assessment.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [assessments, search, status]);

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 ${Colors.background.primary} ${Colors.text.primary} ${Colors.border.defaultThin}`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-2.5 h-4 w-4 ${Colors.text.secondary}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assessments..."
              className={`pl-9 pr-4 py-2 text-sm rounded-md ${Colors.background.secondary} border ${Colors.border.defaultThin}
                         ${Colors.text.primary} placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "all" | Assessment["status"])
            }
            aria-label="Filter assessments by status"
            className={`px-3 py-2 text-sm rounded-md ${Colors.background.secondary} ${Colors.border.defaultThin}
                       ${Colors.text.secondary} focus:outline-none`}
          >
            <option value="all">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="ENDED">Ended</option>
          </select>
        </div>

        {/* Result Count */}
        <div
          className={`flex items-center gap-2 text-sm ${Colors.text.secondary}`}
        >
          <Filter className="h-4 w-4" />
          {filteredAssessments.length} results
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full rounded-lg">
          <thead
            className={`${Colors.background.primary} ${Colors.border.defaultThick}`}
          >
            <tr className={`text-left text-sm ${Colors.text.secondary}`}>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Start Time</th>
              <th className="px-4 py-3">End Time</th>
              <th className="px-4 py-3">Section Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
              <th className="px-4 py-3">report</th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-800 animate-pulse"
                >
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td
                      key={j}
                      className={`px-4 py-4 ${Colors.text.secondary}`}
                    >
                      <div className="h-4 w-full rounded bg-neutral-700/60" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              filteredAssessments.map((assessment) => (
                // Guard external report links so Link never receives undefined href.
                <tr
                  key={assessment.id}
                  className={`border-b border-neutral-800 text-sm ${Colors.hover.special} transition ${Colors.background.secondary} `}
                >
                  <td
                    className={`px-4 py-3 font-medium ${Colors.text.primary}`}
                  >
                    {assessment.name}
                  </td>

                  <td
                    className={`px-4 py-3 ${Colors.text.secondary} line-clamp-2`}
                  >
                    {assessment.description}
                  </td>

                  <td className={`px-4 py-3 ${Colors.text.secondary}`}>
                    {new Date(assessment.startTime).toLocaleString()}
                  </td>

                  <td className={`px-4 py-3 ${Colors.text.secondary}`}>
                    {new Date(assessment.endTime)
                      .toLocaleString()
                      .replace("GMT", "")}
                  </td>

                  <td className={`px-4 py-3 ${Colors.text.secondary}`}>
                    {assessment.individualSectionTimeLimit
                      ? `${assessment.individualSectionTimeLimit} mins`
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    {assessment.status === "UPCOMING" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                                       bg-blue-500/10 text-blue-400"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Upcoming
                      </span>
                    )}

                    {assessment.status === "ONGOING" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                                       bg-yellow-500/10 text-yellow-400"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Ongoing
                      </span>
                    )}

                    {assessment.status === "ENDED" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                                       bg-emerald-500/10 text-emerald-400"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Ended
                      </span>
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 text-right ${Colors.text.secondary}`}
                  >
                    {assessment.status === "ENDED" && (
                      <button
                        onClick={() =>
                          router.push(
                            `/admin-dashboard/reports/assessment/${assessment.id}`,
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer
                                 ${Colors.border.specialThin} ${Colors.hover.special}  ${Colors.text.special} transition`}
                      >
                        View
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {assessment.status === "ENDED" ? (
                      <>
                        {assessment.reportStatus === "PROCESSED" &&
                        assessment.report ? (
                          <Link
                            href={assessment.report}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                          >
                            View Report
                          </Link>
                        ) : assessment.reportStatus === "PROCESSED" ? (
                          <button
                            onClick={() => handleReportRequest(assessment.id)}
                            className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                          >
                            Regenerate Report
                          </button>
                        ) : assessment.reportStatus === "NOT_REQUESTED" ? (
                          <button
                            onClick={() => handleReportRequest(assessment.id)}
                            className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                          >
                            Request Report
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-yellow-600">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                            Under processing
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

            {!loading && filteredAssessments.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className={`px-4 py-10 text-center ${Colors.text.secondary}`}
                >
                  No matching assessments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllAssessments;


