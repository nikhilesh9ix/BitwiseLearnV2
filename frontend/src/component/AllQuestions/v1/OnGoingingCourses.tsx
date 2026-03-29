"use client";

import Link from "next/link";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import { useStudent } from "@/store/studentStore";
import { useTeacher } from "@/store/teacherStore";

function OngoingCourses() {
  const { info } = useStudent();
  const { info: teacherInfo } = useTeacher();
  const Colors = useColors();

  const student = info?.data;
  const teacher = teacherInfo?.data;
  const institution =
    student?.insitution ?? student?.institution ?? teacher?.institution;

  return (
    <div
      className={`${Colors.background.secondary} ${Colors.border.fadedThick} p-6 my-3 ml-3 rounded-2xl`}
    >
      {/* Header */}
      <span className={`text-6xl ${Colors.text.primary} font-semibold`}>
        Welcome,
      </span>{" "}
      <span className={`text-6xl ${Colors.text.special} font-semibold`}>
        {student?.name || teacher?.name || "Student"}
      </span>
      <p className={`mt-1 text-xl ${Colors.text.secondary}`}>
        Continue where you left off or review your details
      </p>
      {/* Student Info Panel */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className={`${Colors.background.primary} p-4 rounded-xl`}>
          <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
            Student Details
          </h3>

          <p className={`${Colors.text.secondary} mt-2`}>
            <span className="font-medium">Email:</span>{" "}
            {student?.email || teacher?.email}
          </p>
          {student?.rollNumber && (
            <p className={`${Colors.text.secondary}`}>
              <span className="font-medium">Roll Number:</span>{" "}
              {student?.rollNumber}
            </p>
          )}
        </div>

        {/* Batch Info */}
        {student?.batch && (
          <div className={`${Colors.background.primary} p-4 rounded-xl`}>
            <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
              Batch Information
            </h3>

            <p className={`${Colors.text.secondary} mt-2`}>
              <span className="font-medium">Batch:</span>{" "}
              {student?.batch.batchname}
            </p>
            <p className={`${Colors.text.secondary}`}>
              <span className="font-medium">Branch:</span>{" "}
              {student?.batch.branch}
            </p>
            <p className={`${Colors.text.secondary}`}>
              <span className="font-medium">End Year:</span>{" "}
              {student?.batch.batchEndYear}
            </p>
          </div>
        )}

        {/* Institution Info */}
        <div
          className={`${Colors.background.primary} p-4 rounded-xl md:col-span-2`}
        >
          <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
            Institution
          </h3>

          <p className={`${Colors.text.secondary} mt-2`}>
            <span className="font-medium">Name:</span>{" "}
            {institution?.name || "N/A"}
          </p>
          {institution?.tagline && (
            <p className={`${Colors.text.secondary}`}>
              <span className="font-medium">Tagline:</span>{" "}
              {institution?.tagline}
            </p>
          )}

          {institution?.websiteLink && (
            <Link
              href={institution?.websiteLink}
              target="_blank"
              className={`inline-block mt-2 ${Colors.text.special} underline`}
            >
              Visit Website →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default OngoingCourses;
