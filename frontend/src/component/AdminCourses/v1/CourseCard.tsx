"use client";

import Image from "next/image";
import { Clock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export type Course = {
  id: string;
  name: string;
  level: "BASIC" | "INTERMEDIATE" | "ADVANCE" | "ALL";
  description: string;
  duration?: string;
  thumbnail?: string;
  instructorName: string;
  isPublished: "PUBLISHED" | "NOT_PUBLISHED";
};

type CourseCardProps = {
  course: Course;
};

const CourseCard = ({ course }: CourseCardProps) => {
  const router = useRouter();

  const level = course.level?.toUpperCase();

  const isDraft = course.isPublished !== "PUBLISHED";
  const Colors = getColors();

  const levelStyles =
    level === "BASIC"
      ? Colors.text.primary
      : level === "INTERMEDIATE"
        ? "text-yellow-400"
        : level === "ADVANCE"
          ? "text-red-400"
          : "text-gray-400";

  const handleNavigate = () => {
    router.push(`/admin-dashboard/courses/${course.id}`);
  };

  return (
    <div
      className={`
        group overflow-hidden rounded-2xl
        ${Colors.background.secondary} ${Colors.text.primary}
        p-3 transition-all duration-300
        hover:-translate-y-1 hover:scale-[1.02]
        hover:shadow-[0_0_0_1px_#64ACFF,0_20px_40px_rgba(0,0,0,0.4)]
      `}
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl">
        <Image
          src={course.thumbnail || "/images/jsCard.jpg"}
          alt="Course thumbnail"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-4">
        {/* Title + Delete */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-tight">
            {course.name}
          </h3>

          {isDraft && (
            <span
              className={`
                        text-xs font-medium
        px-2.5 py-1
        rounded-full
        ${Colors.background.primary}
        ${Colors.text.secondary}
        border border-slate-600/40
                `}
            >
              Draft
            </span>
          )}
        </div>

        {/* Level + Duration */}
        <div
          className={`flex items-center justify-between text-sm ${Colors.text.secondary}`}
        >
          <span
            className={`rounded-md ${Colors.background.primary} px-3 py-1 text-xs font-semibold ${levelStyles}`}
          >
            {level}
          </span>

          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
        </div>

        <p className={`text-sm ${Colors.text.secondary} line-clamp-2`}>
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold ${Colors.text.black}`}>
              {course.instructorName?.charAt(0).toUpperCase()}
            </div>
            <span className={`text-sm font-medium ${Colors.text.primary}`}>
              {course.instructorName}
            </span>
          </div>

          <button
            onClick={handleNavigate}
            className={`text-sm opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer ${Colors.text.special} hover:underline`}
          >
            Manage →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;


