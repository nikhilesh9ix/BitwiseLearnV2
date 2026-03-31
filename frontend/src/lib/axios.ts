import axios from "axios";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const getClientBaseURL = () => {
  const isAccessedFromLocalhost = LOCALHOST_HOSTS.has(window.location.hostname);
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!isAccessedFromLocalhost) {
    return window.location.origin;
  }

  if (!publicApiUrl) {
    return window.location.origin;
  }

  try {
    const parsedUrl = new URL(publicApiUrl);
    const isConfiguredAsLocalhost = LOCALHOST_HOSTS.has(parsedUrl.hostname);

    if (isConfiguredAsLocalhost && !isAccessedFromLocalhost) {
      return window.location.origin;
    }

    return publicApiUrl;
  } catch {
    return publicApiUrl;
  }
};

const getBaseURL = () => {
  if (typeof window === "undefined") {
    return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
  }

  return getClientBaseURL();
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const requestUrl = config.url ?? "";
    const isFrontendProxyRoute =
      requestUrl.startsWith("/api/") && !requestUrl.startsWith("/api/v1/");

    if (isFrontendProxyRoute) {
      config.baseURL = `${window.location.protocol}//${window.location.host}`;
    }
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
export default axiosInstance;
