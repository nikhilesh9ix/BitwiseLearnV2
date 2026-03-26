"use client";

import { getAllCourses } from "@/api/courses/course/get-all-courses";
import { enrollInstitutionCourses } from "@/api/courses/course/enrollments/enroll-institution";
import React, { use, useEffect, useState } from "react";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import toast from "react-hot-toast";

interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  duration: string;
  thumbnail?: string;
}

function CourseForm({ batchId }: { batchId: string }) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const Colors = useColors();

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleSubmit = async () => {
    if (!selectedCourses.length) {
      alert("Please select at least one course");
      return;
    }

    try {
      setLoading(true);
      // API call goes here
      await enrollInstitutionCourses({
        batchId,
        courses: selectedCourses,
      });

      toast.success("Institution enrolled successfully 🎉");
      setSelectedCourses([]);
      window.location.reload();
    } catch (error) {
      // console.error(error);
      alert("Something went wrong while enrolling courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function handleLoad() {
      const data: Course[] = await getAllCourses(false);
      setAllCourses(data);
    }
    handleLoad();
  }, []);

  return (
    <div className={`space-y-4 ${Colors.text.primary}`}>
      <h2 className="text-lg font-semibold">Select Courses</h2>

      {/* Scrollable flex container */}
      <div
        className={`flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-2 ${Colors.background.primary} hover:opacity-90 rounded-md`}
        style={{}}
      >
        {allCourses.map((course) => (
          <label
            key={course.id}
            className={`flex gap-4 items-start p-3 rounded cursor-pointer`}
          >
            <input
              type="checkbox"
              checked={selectedCourses.includes(course.id)}
              onChange={() => handleToggleCourse(course.id)}
              className="mt-2"
            />

            {/* Thumbnail */}
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.name}
                className="w-20 h-14 object-cover rounded"
              />
            )}

            {/* Course info */}
            <div className="flex flex-col">
              <p className="font-medium">{course.name}</p>
              <p className={`text-sm ${Colors.text.secondary}`}>
                {course.level} • {course.duration}
              </p>
              <p className={`text-sm ${Colors.text.secondary} line-clamp-2`}>
                {course.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      <button
        disabled={loading}
        className={`px-4 py-2 cursor-pointer rounded disabled:opacity-50 disabled:cursor-not-allowed ${Colors.background.special} ${Colors.hover.special} ${Colors.text.primary}`}
        onClick={handleSubmit}
      >
        {loading ? "Enrolling..." : "Enroll Institution"}
      </button>
    </div>
  );
}

export default CourseForm;
