import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:4000/",
  headers: {
    "Content-Type": "application/json",
  },
});
// Interceptor
api.interceptors.request.use(
  (configuracion) => {
    const tokenGuardado = localStorage.getItem("token");
    if (tokenGuardado) {
      configuracion.headers.Authorization = `Bearer ${tokenGuardado}`;
    }
    return configuracion;
  },
  (error) => Promise.reject(error),
);
export default api;
