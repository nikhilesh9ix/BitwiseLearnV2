"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, ChevronUp, ChevronDown } from "lucide-react";
import SideBar from "@/component/general/SideBar";
import Link from "next/link";
import { useRef } from "react";
import axiosInstance from "@/lib/axios";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import StudentSideBar from "@/component/general/StudentSidebar";
import { useAdmin } from "@/store/adminStore";
import { getStudentCourses } from "@/api/courses/course/get-all-courses";

type CourseLevel = "Basic" | "Intermediate" | "Advanced" | "ALL";

interface Course {
  id: string;
  name: string;
  isPublished: string;
  description: string;
  level: CourseLevel;
  duration?: string;
  thumbnail?: string | null;
  instructorName: string;
}

const Colors = getColors();

export const getAllCourses = async () => {
  const res = await axiosInstance.get("/api/course");
  return res.data;
};

function normalizeLevel(level: string): CourseLevel {
  switch (level) {
    case "BASIC":
      return "Basic";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCE":
    case "ADVANCED":
      return "Advanced";
    default:
      return "Basic";
  }
}

function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  const levelStyles =
    course.level === "Basic"
      ? Colors.text.primary
      : course.level === "Intermediate"
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div
      onClick={() => router.push(`/courses/${course.id}`)}
      className={`${Colors.background.secondary} rounded-xl p-4 flex flex-col gap-3 cursor-pointer
      hover:scale-[1.02]
      border border-transparent hover:border-[#64ACFF]/40
      transition-all duration-300`}
    >
      <div
        className={`${Colors.background.primary} relative w-full aspect-video rounded-lg overflow-hidden`}
      >
        <Image
          src={course.thumbnail || "/images/jsCard.jpg"}
          alt={course.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <h3 className={`${Colors.text.primary} text-lg font-semibold`}>
        {course.name}
      </h3>

      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-md ${Colors.background.primary} font-medium ${levelStyles}`}
        >
          {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
        </span>

        {course.duration && (
          <span className={`${Colors.text.secondary} flex items-center gap-2`}>
            <Clock size={18} />
            {course.duration}
          </span>
        )}
      </div>

      <p className={`${Colors.text.secondary} text-sm line-clamp-2`}>
        {course.description}
      </p>

      <div className="flex items-center justify-end gap-2 mt-auto">
        <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-black font-semibold">
          {course.instructorName.charAt(0)}
        </div>
        <span className={`${Colors.text.primary} text-sm font-medium`}>
          {course.instructorName}
        </span>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */
function CourseSkeleton() {
  return (
    <div
      className={` rounded-xl p-4 flex flex-col gap-4 animate-pulse ${Colors.background.secondary}`}
    >
      <div className={`h-40 ${Colors.background.primary} rounded-lg`} />
      <div className={`h-5 w-3/4 ${Colors.background.primary} rounded`} />
      <div className="flex justify-between">
        <div className={`h-4 w-20 ${Colors.background.primary} rounded`} />
        <div className={`h-4 w-16 ${Colors.background.primary} rounded`} />
      </div>
      <div className="space-y-2">
        <div className={`h-4 ${Colors.background.primary} rounded`} />
        <div className={`h-4 w-5/6 ${Colors.background.primary} rounded`} />
      </div>
      <div className="flex justify-end gap-2 mt-auto">
        <div className={`w-7 h-7 ${Colors.background.primary} rounded-full`} />
        <div className={`h-4 w-20 ${Colors.background.primary} rounded`} />
      </div>
    </div>
  );
}

/*------------ NO COURSES FOUND ANIMATION ------------ */
function NoCoursesFound() {
  return (
    <div className="col-span-full animate-fadeIn flex flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-primaryBlue/30 animate-ping absolute" />
        <div className="w-24 h-24 rounded-full border-4 border-primaryBlue flex items-center justify-center text-primaryBlue text-4xl font-bold">
          ?
        </div>
      </div>

      <h3 className={`mt-6 text-2xl font-semibold ${Colors.text.primary}`}>
        No courses found
      </h3>
      <p className={`text-sm ${Colors.text.secondary} mt-1 max-w-sm`}>
        No matching courses found. Try adjusting your search.
      </p>
    </div>
  );
}

export default function AllCoursesV1() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CourseLevel>("ALL");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const adminInfo = useAdmin().info;

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        let res: any[] = [];
        if (adminInfo?.data?.id && adminInfo.data.id.length > 0) {
          res = await getAllCourses();
        } else {
          try {
            res = await getStudentCourses();
          } catch {
            res = [];
          }

          if (!Array.isArray(res) || res.length === 0) {
            try {
              const dashboardRes = await axiosInstance.get("/api/v1/students/dashboard");
              res = dashboardRes.data?.data?.courses || [];
            } catch {
              res = [];
            }
          }

          if (!Array.isArray(res) || res.length === 0) {
            try {
              const listedRes = await axiosInstance.get("/api/v1/courses/listed-courses");
              res = listedRes.data?.data || [];
            } catch {
              res = [];
            }
          }
        }

        const normalizedRes = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];

        const mappedCourses: Course[] = normalizedRes.map((course: any) => ({
          id: course.id ?? "",
          name: course.name ?? "",
          isPublished: course.isPublished ?? course.is_published ?? "PUBLISHED",
          description: course.description ?? "No description available",
          level: normalizeLevel(course.level ?? "BASIC"),
          duration: course.duration,
          thumbnail: course.thumbnail,
          instructorName: course.instructorName ?? course.instructor_name ?? "Instructor",
        }));

        const filteredCourses = mappedCourses.filter((course) => {
          if (adminInfo?.data?.id && adminInfo.data.id.length > 0) {
            return true;
          }
          return course.isPublished === "PUBLISHED";
        });

        setCourses(filteredCourses);
      } catch (error) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [adminInfo?.data?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCourses = useMemo(() => {
    let data = courses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());

      const matchesLevel = level === "ALL" || c.level === level;

      return matchesSearch && matchesLevel;
    });

    const order = { Basic: 1, Intermediate: 2, Advanced: 3, ALL: 0 };
    data.sort((a, b) => order[a.level] - order[b.level]);

    return data;
  }, [courses, search, level]);

  return (
    <div
      className={`flex h-screen ${Colors.background.primary} ${Colors.text.primary}`}
    >
      <StudentSideBar />

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center gap-10 mb-5">
          {/* Search */}
          <div
            className={`w-1/2 ${Colors.background.secondary} rounded-lg px-4 py-2 flex items-center gap-2`}
          >
            <Search size={18} className={Colors.text.special} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className={`bg-transparent outline-none w-full text-sm ${Colors.text.primary}`}
            />
          </div>

          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className={`${Colors.background.secondary} px-4 py-2 rounded-xl flex items-center gap-2 text-sm cursor-pointer`}
            >
              {level === "ALL" ? "All Levels" : level}
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
              <div
                className={`absolute right-0 mt-2 w-40 ${Colors.background.secondary} rounded-xl border border-white/10 shadow-lg overflow-hidden z-50`}
              >
                {["ALL", "Basic", "Intermediate", "Advanced"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLevel(l as CourseLevel);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 cursor-pointer"
                  >
                    {l === "ALL" ? "All Levels" : l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="flex mb-5 text-xl gap-1 items-center">
          <Link
            href="/learning"
            className={`font-semibold ${Colors.text.secondary} ${Colors.hover.textSpecial}`}
          >
            My Learnings
          </Link>
          <span className="text-primaryBlue text-6xl mb-3 font-light">
            &gt;
          </span>
          <div className="font-light mb-1 text-4xl">Courses</div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)
          ) : filteredCourses.length === 0 ? (
            <NoCoursesFound />
          ) : (
            filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}


