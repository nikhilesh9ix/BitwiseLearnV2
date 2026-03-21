"use client";

import axios from "axios";
import { useInstitution } from "@/store/institutionStore";
import { useAdmin } from "@/store/adminStore";
import { useStudent } from "@/store/studentStore";
import { useTeacher } from "@/store/teacherStore";
import useVendor from "@/store/vendorStore";

interface Prop {
  email: string;
  password: string;
  role: "STUDENT" | "INSTITUTION" | "ADMIN" | "VENDOR" | "TEACHER";
}

async function handleLogin({ data }: { data: Prop }) {
  const response = await axios.post("/api/login", data);
  const resData = response.data;

  if (resData?.tokens?.accessToken) {
    localStorage.setItem("accessToken", resData.tokens.accessToken);
  }
  if (resData?.tokens?.refreshToken) {
    localStorage.setItem("refreshToken", resData.tokens.refreshToken);
  }

  // grab zustand setters
  const { setData: setAdmin } = useAdmin.getState();
  const { setData: setStudent } = useStudent.getState();
  const { setData: setTeacher } = useTeacher.getState();
  const { setData: setInstitution } = useInstitution.getState();
  const { setData: setVendor } = useVendor.getState();

  // set correct store based on role
  switch (data.role) {
    case "ADMIN":
      setAdmin({ data: resData });
      break;

    case "STUDENT":
      setStudent(resData);
      break;

    case "TEACHER":
      setTeacher(resData);
      break;

    case "INSTITUTION":
      setInstitution({ data: resData });
      break;

    case "VENDOR":
      setVendor({ data: resData });
      break;
  }

  return resData;
}

export default handleLogin;
