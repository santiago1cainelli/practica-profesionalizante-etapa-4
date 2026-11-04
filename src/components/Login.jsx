import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// CAMBIO 1: Importamos nuestro Hook personalizado de Autenticacion
import { useAutenticacion } from "../hooks/useAutenticacion";
function Login() {
  // CAMBIO 2: Ahora manejamos correo electrónico y contraseña
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // CAMBIO 3: Estados para retroalimentación visual (cargando y errores)
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  // CAMBIO 4: Consumimos la función de Login del Contexto y el navegador de React Router
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  // ELIMINADO: La constante 'PASSWORD_SECRETA = "elDogo2024"' ya no se usa,
  // la validación ahora se hace de forma segura en el Backend (MySQL + bcrypt).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError("");
    setCargando(true);
    // CAMBIO 5: Llamada asíncrona a nuestra API a través de 'iniciarSesion'
    const resultado = await iniciarSesion(email, password);
    setCargando(false);
    if (resultado.exito) {
      // Si el login fue exitoso, redirigimos a la pantalla protegida de clientes
      navegar("/clientes");
    } else {
      // Si hubo error (ej. contraseña incorrecta), lo mostramos en pantalla
      setMensajeError(resultado.mensaje);
      setPassword(""); // Limpiamos la contraseña por seguridad
    }
  };
  return (
    <div
      className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-
hidden border border-slate-100 dark:border-slate-700"
    >
      <div className="px-8 py-10">
        <div className="text-center mb-10">
          <div
            className="mx-auto h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex
items-center justify-center mb-4 text-3xl shadow-sm"
          ></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Bienvenido a El Dogo
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Ingresa tu correo y clave de acceso para continuar.
          </p>
        </div>
        {/* CAMBIO 6: Cartel interactivo para mostrar errores de autenticación */}
        {mensajeError && (
          <div
            className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-
lg text-center"
          >
            {mensajeError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CAMBIO 7: Nuevo campo de entrada para el Correo Electrónico */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-
slate-200 mb-2"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@eldogo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-
slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500

outline-none transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700
dark:text-slate-200 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-
slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500

outline-none transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
              required
            />
          </div>
          {/* CAMBIO 8: Botón adaptado con estado de carga (disabled mientras conecta) */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform
hover:-translate-y-0.5"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
      <div
        className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100
dark:border-slate-700 text-center"
      >
        <p className="text-xs text-slate-500">
          ¿Olvidaste tu contraseña? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}
export default Login;
