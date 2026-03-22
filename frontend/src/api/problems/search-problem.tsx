import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function searchProblem(query: string) {
  try {
    if (query.trim().length === 0) {
      toast.error("search cannot be empty");
    }
    const data = await axiosInstance.post("/api/v1/problems/search-question", {
      query,
    });

    return data.data;
  } catch (error) {
    toast.error("no problem found");
  }
}
