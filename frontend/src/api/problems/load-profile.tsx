import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
export const loadProfile = async () => {
  try {
    const res = await axiosInstance.get(
      "/api/v1/problems/get-user-solved-questions/",
    );
    // Transform the response to match the expected format if needed
    // But backend returns data directly in 'data' field wrapped in api_response
    // let's assume res.data is the correct payload wrapper
    return res.data;
  } catch (error) {
    toast.error("failed to load profile");
  }
};
