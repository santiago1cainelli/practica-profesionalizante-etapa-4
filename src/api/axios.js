import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:3000/api",
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

// Interceptor de respuesta para desempaquetar el sobre estándar de NestJS { data, timestamp }
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'timestamp' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Si la sesión expira o es 401 en peticiones autenticadas, no bloquear app
    if (error.response && error.response.status === 401) {
      // Limpiar token si fue rechazado por invalidez
      if (!error.config?.url?.includes('/auth/login')) {
        // Petición regular falló por 401
      }
    }
    return Promise.reject(error);
  },
);

export default api;
