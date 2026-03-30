"use client";

import { useEffect, useState } from "react";
import { User, Clock, Search } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useStudent } from "@/store/studentStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getStudentCourses } from "@/api/courses/course/get-all-courses";
import axiosInstance from "@/lib/axios";

/* ---------------- TYPES ---------------- */

type CourseLevel = "Basic" | "Intermediate" | "Advanced";

interface Course {
  id: string;
  name: string;
  description: string;
  isPublished: string;
  level: CourseLevel;
  duration?: string;
  thumbnail?: string | null;
  instructorName: string;
}

/* ---------------- HELPERS ---------------- */

function normalizeLevel(level: string): CourseLevel {
  switch (level) {
    case "BASIC":
      return "Basic";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return "Basic";
  }
}

/* ---------------- HEADER ---------------- */
function Header({ name, email }: { name: string; email: string }) {
  const Colors = getColors();
  return (
    <div className="flex justify-between p-4">
      <div>
        <span className={`text-5xl ${Colors.text.special}`}>Greetings,</span>{" "}
        <span className={`text-5xl ${Colors.text.primary}`}>{name}</span>
        <div className="mt-2 text-lg">
          <span className={`${Colors.text.primary}`}>Welcome back to</span>{" "}
          <span className={`${Colors.text.special}`}>B</span>
          <span className={`${Colors.text.primary}`}>itwise Learn</span>
        </div>
      </div>

      <div className="flex mr-11">
        <div className="p-8 bg-white rounded-full flex justify-center items-center">
          <User size={35} color="black" />
        </div>
        <div className={` ${Colors.text.primary} flex flex-col mt-3 ml-4`}>
          <h1 className={`${Colors.text.primary} text-3xl`}>{name}</h1>
          <p>{email}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- HERO SECTION ---------------- */
export default function HeroSection() {
  const Colors = getColors();
  const student = useStudent();
  const studentData =
    (student.info as { data?: { name?: string; email?: string; batch?: { id?: string } }; name?: string; email?: string; batch?: { id?: string } } | null)
      ?.data ??
    (student.info as { name?: string; email?: string; batch?: { id?: string } } | null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const batchID = studentData?.batch?.id;

  useEffect(() => {
    const fetchCourses = async () => {
      let data: unknown[] = [];

      try {
        setLoading(true);
        // For older persisted sessions, hydrate missing student profile fields.
        if (!batchID) {
          try {
            await axiosInstance.get("/api/v1/students/dashboard");
          } catch {
            // Non-fatal: continue with other sources.
          }
        }

        // Primary source: student course endpoint (published, enrolled courses).
        try {
          data = await getStudentCourses();
        } catch {
          data = [];
        }

        // Fallback source: dashboard payload for environments where publish/enrollment
        // state is temporarily inconsistent but student has course linkage.
        if (!Array.isArray(data) || data.length === 0) {
          try {
            const dashboardRes = await axiosInstance.get("/api/v1/students/dashboard");
            data = dashboardRes.data?.data?.courses || [];
          } catch {
            data = [];
          }
        }

        // Last fallback: public listed courses to avoid blank student dashboard
        // when enrollment mapping is temporarily missing.
        if (!Array.isArray(data) || data.length === 0) {
          try {
            const listedRes = await axiosInstance.get("/api/v1/courses/listed-courses");
            data = listedRes.data?.data || [];
          } catch {
            data = [];
          }
        }

        const normalized: Course[] = data.map((course: unknown) => {
          const current = course as {
            level?: string;
            id?: string;
            name?: string;
            description?: string;
            isPublished?: string;
            is_published?: string;
            duration?: string;
            thumbnail?: string | null;
            instructorName?: string;
            instructor_name?: string;
          };

          return {
            id: current.id ?? "",
            name: current.name ?? "",
            description: current.description ?? "No description available",
            isPublished: current.isPublished ?? current.is_published ?? "PUBLISHED",
            level: normalizeLevel(current.level ?? "BASIC"),
            duration: current.duration,
            thumbnail: current.thumbnail,
            instructorName: current.instructorName ?? current.instructor_name ?? "Instructor",
          };
        });

        setCourses(normalized);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [batchID]);

  return (
    <>
      <Header
        name={studentData?.name ?? "Student"}
        email={studentData?.email ?? ""}
      />

      <section className="px-6 mt-10">
        {loading && (
          <p className={`${Colors.text.secondary} text-center`}>
            Loading courses…
          </p>
        )}

        {!loading && courses.length === 0 && (
          <p className={`${Colors.text.secondary} text-center`}>
            No courses available for your batch.
          </p>
        )}

        <div className=" flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className={`${Colors.text.special} text-3xl font-semibold`}>
              Courses
            </h1>

            <div className="w-full flex">
              <div className="relative mb-3 w-1/3">
                <Search
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${Colors.text.special}`}
                />
                <input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 ${Colors.background.secondary} ${Colors.text.primary} rounded-lg outline-none focus:ring-1 focus:ring-primaryBlue`}
                />
              </div>
            </div>
          </div>
          {!loading && filteredCourses.length === 0 && courses.length > 0 && (
            <p className={`${Colors.text.secondary} text-center`}>
              No courses match your search.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CourseCard({ course }: { course: Course }) {
  const Colors = getColors();
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

/* ---------------- ENTITY TABS ---------------- */
// import { School, Handshake, ShieldCheck } from "lucide-react";

// const ENTITY_META: Record<
//   string,
//   {
//     icon: any;
//     label: string;
//     tagline: string;
//     accent: string;
//   }
// > = {
//   institutions: {
//     icon: School,
//     label: "Institutions",
//     tagline: "Education centers associated with us",
//     accent: "from-blue-500/20 to-blue-500/5",
//   },
//   vendors: {
//     icon: Handshake,
//     label: "Vendors",
//     tagline: "Industry trainers who got involved",
//     accent: "from-emerald-500/20 to-emerald-500/5",
//   },
//   admins: {
//     icon: ShieldCheck,
//     label: "Admins",
//     tagline: "People maintaining our platform",
//     accent: "from-orange-500/20 to-orange-500/5",
//   },
// };

// function EntityTabs({ fields, data }: EntityTabsProps) {
//   if (!fields.length) {
//     return <p className="text-white/60 text-center mt-6">Loading dashboard…</p>;
//   }

//   return (
//     <div className="mx-20 mt-8 grid grid-cols-1 gap-3">
//       {fields.map((field) => {
//         const meta = ENTITY_META[field];
//         const href = URL_MAP[field];
//         if (!meta || !href) return null;

//         const Icon = meta.icon;

//         return (
//           <Link
//             key={field}
//             href={href}
//             className={`
//                             group relative rounded-2xl p-6
//               ${Colors.background.secondary} overflow-hidden
//               hover:shadow-2xl hover:-translate-y-1
//               transition-all duration-300
//               `}
//           >
//             {/* Gradient depth layer */}
//             <div
//               className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-0 group-hover:opacity-100 transition`}
//             />

//             {/* Content */}
//             <div className="relative z-10 flex flex-col gap-4">
//               {/* Icon + Count */}
//               <div className="flex items-center justify-between">
//                 <div className={`p-3 rounded-xl ${Colors.background.primary}`}>
//                   <Icon className={`text-primaryBlue`} size={28} />
//                 </div>
//                 <span className={`text-3xl font-bold ${Colors.text.primary}`}>
//                   {data[field] ?? 0}
//                 </span>
//               </div>

//               {/* Text */}
//               <div>
//                 <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
//                   {meta.label}
//                 </h3>
//                 <p className={`text-sm mt-1 leading-snug ${Colors.text.secondary}`}>
//                   {meta.tagline}
//                 </p>
//               </div>
//             </div>
//           </Link>
//         );
//       })}
//     </div>
//   );
// }


