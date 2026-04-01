import axiosInstance from "@/lib/axios";

const normalizeEnrollments = (raw: any) => {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any) => ({
    institution: {
      id: item?.institution?.id ?? item?.institution_id ?? "",
      name: item?.institution?.name ?? "Unknown Institution",
    },
    batch: {
      id: item?.batch?.id ?? item?.batch_id ?? "",
      batchname: item?.batch?.batchname ?? item?.batch_name ?? "",
      branch: item?.batch?.branch ?? "",
    },
  }));
};

const normalizeCourse = (raw: any) => ({
  id: raw?.id,
  name: raw?.name,
  description: raw?.description,
  level: raw?.level,
  duration: raw?.duration,
  thumbnail: raw?.thumbnail,
  instructorName: raw?.instructor_name ?? raw?.instructorName,
  certificate: raw?.certificate,
  isPublished: raw?.is_published ?? raw?.isPublished,
  createdAt: raw?.created_at ?? raw?.createdAt,
});

export async function getCourseEnrollments(
  id: string,
  courseInfo: any,
  stateFn: any,
) {
  try {
    const response = await axiosInstance.get(
      "/api/v1/courses/get-course-enrollments/" + id,
    );
    const payload = response?.data?.data ?? response?.data ?? {};

    courseInfo(normalizeCourse(payload?.course ?? {}));
    stateFn(normalizeEnrollments(payload?.data ?? payload));
  } catch {
    courseInfo({});
    stateFn([]);
  }
}
export async function getInstituteEnrollments(
  id: string,
  institutionId: string,
  courseInfo: any,
  stateFn: any,
) {
  try {
    const response = await axiosInstance.get(
      "/api/course/enrollments/institute/" + institutionId + "/" + id,
    );
    const payload = response?.data?.data ?? response?.data ?? {};

    courseInfo(normalizeCourse(payload?.course ?? {}));
    stateFn(normalizeEnrollments(payload?.data ?? payload));
  } catch {
    courseInfo({});
    stateFn([]);
  }
}
