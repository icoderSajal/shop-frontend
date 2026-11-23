// import axios from "axios";
// const api = axios.create({
//   baseURL: "https://shop-backend-jyoh.onrender.com".replace(/\/$/, "") + "/api",
//   timeout: 30000,
// });
// api.interceptors.request.use((c) => {
//   const t = localStorage.getItem("token");
//   if (t) c.headers.Authorization = "Bearer " + t;
//   return c;
// });
// export const err = (e) =>
//   e?.response?.data?.message ||
//   (e?.code === "ECONNABORTED"
//     ? "Server is waking up, please try again in a few seconds"
//     : e?.message) ||
//   "Something went wrong";
// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "https://shop-backend-jyoh.onrender.com/api",
  timeout: 60000,
});

// Attach authentication token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Handle API errors
export const err = (error) => {
  return (
    error?.response?.data?.message ||
    (error?.code === "ECONNABORTED"
      ? "Server is waking up. Please try again in a few seconds."
      : error?.message) ||
    "Something went wrong."
  );
};

export default api;
