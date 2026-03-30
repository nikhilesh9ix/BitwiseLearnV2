"use client";

import { motion } from "framer-motion";
import CourseCard, { Course } from "./CourseCard";
import { useState, useEffect } from "react";
import { Search, BookAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllCourses } from "@/api/courses/course/get-all-courses";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";
import CourseForm from "@/component/(admin-course-pages)/course-form/CourseForm";
import toast from "react-hot-toast";
import { getColors } from "@/component/general/(Color Manager)/useColors";

const Colors = getColors();

const RightSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<
    "ALL" | "BASIC" | "INTERMEDIATE" | "ADVANCE"
  >("ALL");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      // console.error("Failed to fetch courses", error);
      toast.error("Failed to fetch Courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let result = courses;

    if (searchText.trim()) {
      result = result.filter((course) =>
        course.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    if (filter !== "ALL") {
      result = result.filter(
        (course) => course.level?.toUpperCase() === filter,
      );
    }

    setFilteredCourses(result);
  }, [searchText, filter, courses]);

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

  const [courseForm, setShowCourseForm] = useState(false);

  const handleCourseCreated = async () => {
    toast.success("Course Created SuccessFully");
    setShowCourseForm(false);
    await fetchCourses();
  };

  const CourseSkeleton = () => {
    return (
      <div
        className={`
                  rounded-xl p-4 flex flex-col gap-4
        ${Colors.background.secondary} animate-pulse
          `}
      >
        <div
          className={`h-40 w-full rounded-lg ${Colors.background.primary}`}
        />

        <div className={`h-5 w-3/4 rounded ${Colors.background.primary}`} />

        <div className="flex justify-between">
          <div className={`h-4 w-20 rounded ${Colors.background.primary}`} />
          <div className={`h-4 w-16 rounded ${Colors.background.primary}`} />
        </div>

        <div className="space-y-2">
          <div className={`h-4 rounded ${Colors.background.primary}`} />
          <div className={`h-4 w-5/6 rounded ${Colors.background.primary}`} />
        </div>

        <div className="flex justify-end gap-2 mt-auto">
          <div
            className={`w-7 h-7 rounded-full ${Colors.background.primary}`}
          />
          <div className={`h-4 w-20 rounded ${Colors.background.primary}`} />
        </div>
      </div>
    );
  };

  const CourseFormModal = courseForm ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowCourseForm(false)}
      />

      {/* MODAL CONTENT */}
      <div
        className={`relative z-50 w-full max-w-2xl rounded-2xl ${Colors.background.secondary} shadow-2xl p-1`}
        onClick={(e) => e.stopPropagation()} //  IMPORTANT
      >
        <CourseForm
          onClose={() => setShowCourseForm(false)}
          onSuccess={handleCourseCreated}
        />
      </div>
    </div>
  ) : null;

  /* ---------------- NO DATA STATE ---------------- */
  return (
    <>
      {CourseFormModal}
      {!loading && courses && courses.length === 0 ? (
        <section className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center">
          {/* Text Above */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-xl font-semibold ${Colors.text.primary}`}
          >
            Looks like you haven&apos;t created any Courses
          </motion.p>

          {/* Plus / Cross Animation */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex h-23 w-23 items-center justify-center rounded-full bg-[#64ACFF]"
          >
            <BookAlert size={42} className="text-white" />
          </motion.div>

          {/* Sub Text */}
          <p className={`max-w-md text-sm ${Colors.text.secondary}`}>
            Start by creating your first course to organize lessons,
            assignments, and evaluations in one place.
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCourseForm(true)}
            className={`rounded-md ${Colors.background.special} px-6 py-2 font-medium ${Colors.text.primary}`}
          >
            + Create your first course
          </motion.button>
        </section>
      ) : (
        <section className="flex h-full flex-col gap-6 p-4 w-full">
          {/* Search Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${Colors.text.secondary}`}
              />

              <input
                type="text"
                placeholder="Search courses..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`w-full rounded-md ${Colors.background.secondary} pl-10 pr-4 py-2 text-sm outline-none ${Colors.text.primary}`}
              />
            </div>

            <div className="flex gap-3">
              {/* Add Course */}
              <button
                onClick={() => setShowCourseForm(true)}
                className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-medium ${Colors.text.primary} hover:opacity-90 cursor-pointer`}
              >
                + Add Course
              </button>

              {/* Filter Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((p) => !p)}
                  className={`
      flex items-center gap-2 px-4 py-2 rounded-md
      ${Colors.background.secondary} ${Colors.text.primary}
      text-sm font-medium border border-neutral-700
      hover:border-neutral-500 transition cursor-pointer
    `}
                >
                  {filter === "ALL"
                    ? "All Levels"
                    : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {open && (
                  <div
                    className={`
                              absolute right-0 mt-2 w-44
        rounded-xl ${Colors.background.secondary}
        border ${Colors.border.defaultThick}
        shadow-lg overflow-hidden z-50`}
                  >
                    {[
                      { label: "All Levels", value: "ALL" },
                      {
                        label: "Basic",
                        value: "BASIC",
                        color: Colors.text.primary,
                      },
                      {
                        label: "Intermediate",
                        value: "INTERMEDIATE",
                        color: "text-yellow-400",
                      },
                      {
                        label: "Advanced",
                        value: "ADVANCE",
                        color: "text-red-400",
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setFilter(item.value as any);
                          setOpen(false);
                        }}
                        className={`
            w-full px-4 py-2 text-left text-sm
            hover:bg-white/5 transition
            ${item.color ?? Colors.text.primary}
          `}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------- SEARCH EMPTY STATE -------- */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseSkeleton key={i} />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 pt-20 text-center">
              {/* Animated Visual */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex items-center justify-center"
              >
                {/* Core Circle */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${Colors.background.special} ${Colors.text.black} font-bold text-xl shadow-lg`}
                >
                  <Search size={40} />
                </motion.div>
              </motion.div>

              {/* Text */}
              <div className="flex flex-col gap-2">
                <p className={`text-xl font-semibold ${Colors.text.primary}`}>
                  No matching courses found
                </p>

                <p className={`max-w-md text-sm ${Colors.text.secondary}`}>
                  We couldn’t find any courses that match your search. Try
                  adjusting the keywords or explore a different topic.
                </p>
              </div>
            </div>
          ) : (
            /* Cards */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
};

export default RightSection;


