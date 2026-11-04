import { useState } from "react";
import api from "../api/axios";
import { useApp } from "./AppContext.tsx";

const [usuarioActual, setUsuarioActual] = useState(() => {
  const tokenGuardado = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("user");
  if (tokenGuardado && usuarioGuardado) {
    try {
      return JSON.parse(usuarioGuardado);
    } catch (error) {
      console.error("Error al parsear los datos del usuario: ", error);
      return null;
    }
  }
  return null;
});
const iniciarSesion = async (email, passwordPlain) => {
  try {
    const respuesta = await api.post("auth/login", {
      email,
      passwordPlain,
    });
    const { token, user } = respuesta.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUsuarioActual(user);
    return { exito: true };
  } catch (error) {
    const mensajeError =
      error.response?.data?.mensaje || "Error al iniciar la sesión";
    return { exito: false, mensaje: mensajeError };
  }
};
const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setUsuarioActual(null);
};
const valoresContexto = {
  usuarioActual,
  iniciarSesion,
  cerrarSesion,
};
return (
  <useApp.Provider value={valoresContexto}>
    {children}
  </useApp.Provider>
);