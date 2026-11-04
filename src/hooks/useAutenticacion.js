import { useContext } from "react";
import { useApp } from "../context/AppContext.tsx";
export const useAutenticacion = () => {
  const contexto = useContext(useApp);
  if (!contexto) {
    throw new Error(
      "useAutenticacion debe usarse dentro de un ProveedorAutenticacion",
    );
  }
  return contexto;
};