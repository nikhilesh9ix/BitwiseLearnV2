import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

const getUrl = (id: string, entity: string, operation: string) => {
  let url = "";
  switch (entity) {
    case "institution":
      url = operation === "update"
        ? `/api/v1/institutions/update-institution-by-id/${id}`
        : `/api/v1/institutions/delete-institution-by-id/${id}`;
      break;
    case "vendor":
      url = operation === "update"
        ? `/api/v1/vendors/update-vendor-by-id/${id}`
        : `/api/v1/vendors/delete-vendor-by-id/${id}`;
      break;
    case "student":
      url = operation === "update"
        ? `/api/v1/students/update-student-by-id/${id}`
        : `/api/v1/students/delete-student-by-id/${id}`;
      break;
    case "batch":
      url = operation === "update"
        ? `/api/v1/batches/update-batch-by-id/${id}`
        : `/api/v1/batches/delete-batch-by-id/${id}`;
      break;
    case "teacher":
      url = operation === "update"
        ? `/api/v1/teachers/update-teacher-by-id/${id}`
        : `/api/v1/teachers/delete-teacher-by-id/${id}`;
      break;
    case "admin":
      url = operation === "update"
        ? `/api/v1/admins/update-admin-by-id/${id}`
        : `/api/v1/admins/delete-admin-by-id/${id}`;
      break;
    case "courses":
      url = `/api/v1/courses/enrollments/${id}/${operation}`;
      break;
  }
  return url;
};
export const updateEntity = async (id: string, data: any, stateFn: any) => {
  const toastId = toast.loading("Saving Changes...");
  try {
    const updatedData = await axiosInstance.put(
      getUrl(id, data.entity, "update"),
      data.data,
    );
    toast.success("Saved Changes...", { id: toastId });
    if (typeof stateFn === "function") {
      stateFn(updatedData.data);
    }
    return updatedData.data;
  } catch (error) {
    toast.error("Unable to update", { id: toastId });
    throw error;
  }
};
export const deleteEntity = async (id: string, data: any, stateFn: any) => {
  const toastId = toast.loading("Deleting...");
  try {
    const deleteData = await axiosInstance.delete(
      getUrl(id, data.entity, "delete"),
    );
    toast.success("Deleted Entity...", { id: toastId });
    if (typeof stateFn === "function") {
      stateFn(deleteData.data);
    }
    return deleteData.data;
  } catch (error) {
    console.error("Delete failed:", error);
    toast.error("Unable to delete", { id: toastId });
    throw error;
  }
};
