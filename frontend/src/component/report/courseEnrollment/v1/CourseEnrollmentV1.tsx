"use client";

import {
  getCourseEnrollments,
  getInstituteEnrollments,
} from "@/api/courses/course/enrollments/get-all-enrollment";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useAdmin } from "@/store/adminStore";
import { useInstitution } from "@/store/institutionStore";
import {
  Eye,
  Search,
  Filter,
  Building2,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

type CourseInfo = {
  id?: string;
  name?: string;
  description?: string;
  level?: string;
  duration?: string;
  thumbnail?: string;
  instructorName?: string;
  certificate?: string;
  isPublished?: string;
  createdAt?: string;
};

type Enrollment = {
  institution: {
    name: string;
    id: string;
  };
  batch: {
    id: string;
    batchname: string;
    branch: string;
  };
};

function CourseEnrollmentV1({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({});
  const [loading, setLoading] = useState(true);
  const Colors = getColors();
  const router = useRouter();
  // 🔎 Filters
  const [search, setSearch] = useState("");
  const [institution, setInstitution] = useState("all");

  const { info: institutionInfo } = useInstitution();
  const { info: adminInfo } = useAdmin();

  useEffect(() => {
    async function handleLoad() {
      setLoading(true);
      if (adminInfo?.data.id) {
        await getCourseEnrollments(courseId, setCourseInfo, setEnrollments);
      } else {
        if (institutionInfo?.data.id) {
          await getInstituteEnrollments(
            courseId,
            institutionInfo?.data.id,
            setCourseInfo,
            setEnrollments,
          );
        }
      }
      setLoading(false);
    }
    handleLoad();
  }, [courseId, adminInfo?.data.id, institutionInfo?.data.id]);

  // 🧠 Unique institutions
  const institutions = useMemo(() => {
    return Array.from(new Set(enrollments.map((e) => e.institution.name)));
  }, [enrollments]);

  // 🧠 Filtered enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const matchesSearch =
        e.institution.name.toLowerCase().includes(search.toLowerCase()) ||
        e.batch.batchname.toLowerCase().includes(search.toLowerCase()) ||
        e.batch.branch.toLowerCase().includes(search.toLowerCase());

      const matchesInstitution =
        institution === "all" || e.institution.name === institution;

      return matchesSearch && matchesInstitution;
    });
  }, [enrollments, search, institution]);

  // 🧠 Group by Institution
  const groupedEnrollments = useMemo(() => {
    return filteredEnrollments.reduce<Record<string, Enrollment[]>>(
      (acc, curr) => {
        const key = curr.institution.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      },
      {},
    );
  }, [filteredEnrollments]);

  const safeCourseInfo: CourseInfo = courseInfo ?? {};

  return (
    <div
      className={`flex gap-6  h-screen ${Colors.text.primary} ${Colors.background.secondary}`}
    >
      <aside
        className={`w-[320px] ml-4 mt-4 shrink-0 border ${Colors.border.defaultThin} ${Colors.background.primary} rounded-xl overflow-hidden sticky top-4 h-fit`}
      >
        <div
          onClick={() => router.back()}
          className="mb-2 flex gap-3 cursor-pointer"
        >
          <ArrowLeft className={`${Colors.text.primary}`} />
          <p>Go Back </p>
        </div>
        {safeCourseInfo.thumbnail && (
          <div className="h-40 w-full overflow-hidden">
            <Image
              height={100}
              width={100}
              src={safeCourseInfo.thumbnail}
              alt={safeCourseInfo.name || "Course thumbnail"}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5 space-y-4 mt-4">
          <div>
            <h2 className="text-lg font-semibold">{safeCourseInfo.name}</h2>
            <p className={`text-sm ${Colors.text.secondary} mt-1`}>
              {safeCourseInfo.level} • {safeCourseInfo.duration}
            </p>
          </div>

          <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
            {safeCourseInfo.isPublished}
          </span>

          <div className="space-y-3 text-sm">
            <div>
              <p className={`text-sm ${Colors.text.primary} font-semibold`}>
                Instructor
              </p>
              <p className={`${Colors.text.secondary}`}>
                {safeCourseInfo.instructorName}
              </p>
            </div>

            <div>
              <p className={`text-sm ${Colors.text.primary} font-semibold`}>
                Description
              </p>
              <p className={`${Colors.text.secondary}`}>
                {safeCourseInfo.description}
              </p>
            </div>

            <div>
              <p className={`text-sm ${Colors.text.primary} font-semibold`}>
                Total Enrollments
              </p>
              <p className={`${Colors.text.secondary}`}>
                {loading ? "—" : enrollments.length}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 mt-4">
        <div className="mx-auto w-full max-w-[90%] space-y-4">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 ${Colors.background.primary} ${Colors.border.defaultThin}`}
          >
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search
                  className={`absolute left-3 top-2.5 h-4 w-4 ${Colors.text.special}`}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search institution, batch or branch..."
                  className={`pl-9 pr-4 py-2 text-sm rounded-md ${Colors.background.secondary} ${Colors.border.defaultThin}
                ${Colors.text.primary} placeholder:text-neutral-500 focus:outline-none`}
                />
              </div>

              {/* Institution Filter */}
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                aria-label="Filter enrollments by institution"
                className={`px-3 py-2 text-sm rounded-md ${Colors.background.secondary} ${Colors.border.defaultThin} ${Colors.text.primary} focus:outline-none`}
              >
                <option value="all">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`flex items-center gap-2 text-sm ${Colors.text.secondary}`}
            >
              <Filter className="h-4 w-4" />
              {filteredEnrollments.length} enrollments
            </div>
          </div>
          <div
            className={` ${Colors.border.defaultThin} rounded-xl overflow-hidden`}
          >
            <table className="w-full">
              <thead
                className={`${Colors.background.primary} ${Colors.border.defaultThin}`}
              >
                <tr className={`text-left text-sm ${Colors.text.primary}`}>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Report</th>
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  Object.entries(groupedEnrollments).map(
                    ([institutionName, items]) => (
                      <Fragment key={`group-${institutionName}`}>
                        <tr
                          key={institutionName}
                          className={`${Colors.text.secondary} ${Colors.background.primary}`}
                        >
                          <td colSpan={4} className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <Building2
                                className={`h-4 w-4 ${Colors.text.special}`}
                              />
                              {institutionName}
                              <span
                                className={`ml-2 text-xs ${Colors.text.secondary}`}
                              >
                                ({items.length} batches)
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Rows */}
                        {items.map((item) => (
                          <tr
                            key={`${institutionName}-${item.batch.id || item.batch.batchname}`}
                            className={`border-b border-neutral-800 text-sm ${Colors.hover.special}`}
                          >
                            <td className="px-4 py-3"></td>
                            <td
                              className={`px-4 py-3 ${Colors.text.secondary}`}
                            >
                              {item.batch.batchname}
                            </td>
                            <td
                              className={`px-4 py-3 ${Colors.text.secondary}`}
                            >
                              {item.batch.branch}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                className={`inline-flex items-center gap-1 text-sm ${Colors.text.primary} ${Colors.hover.textSpecial}`}
                                href={`/admin-dashboard/reports/courses/${courseId}/${item.batch.id}`}
                              >
                                <Eye className="h-4 w-4" />
                                View Report
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ),
                  )}

                {!loading && filteredEnrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-4 py-10 text-center ${Colors.text.secondary}`}
                    >
                      No matching enrollments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CourseEnrollmentV1;


