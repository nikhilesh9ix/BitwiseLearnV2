"use client";

import React from "react";
import CourseBuilderV1 from "@/component/(admin-course-pages)/course-builder/v1/CourseBuilderV1";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminCourse({ params }: PageProps) {
  const { id } = React.use(params);
  const Colors = getColors();

  return (
    <div className={`flex h-screen overflow-hidden ${Colors.background.primary}`}>
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <CourseBuilderV1 courseId={id} />
      </main>
    </div>
  );
}


