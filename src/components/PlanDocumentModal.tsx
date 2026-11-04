import React from 'react';
import { X, Printer, FileText, ShieldAlert } from 'lucide-react';

interface PlanDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanDocumentModal: React.FC<PlanDocumentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
        
        {/* Barra superior del Modal */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-4 border-[#C53030]">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Documento Técnico Oficial</h3>
              <p className="text-xs text-blue-100">Plan de Implementación Frontend React - Club El Globo (v1.0.0)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded text-white transition-colors cursor-pointer"
              title="Imprimir o Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido del Documento */}
        <div className="p-8 overflow-y-auto font-sans text-slate-800 text-sm leading-relaxed bg-white print:p-0">
          
          {/* Banner del Documento */}
          <div className="bg-[#1A365D] text-white p-6 rounded-md mb-6 border-b-4 border-[#C53030]">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              PLAN DE IMPLEMENTACIÓN FRONTEND REACT
            </h1>
            <p className="text-sm text-blue-100 font-light">
              Sistema de Gestión Integral — Club Social y Deportivo "El Globo"
            </p>
          </div>

          {/* Grilla Metadatos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-md mb-6 text-xs">
            <div>
              <span className="font-bold text-[#2B6CB0] block">PROYECTO:</span>
              <span className="text-slate-700">Club El Globo - Panel Web (React)</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">VERSIÓN:</span>
              <span className="text-slate-700">1.0.0</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">AUTORES:</span>
              <span className="text-slate-700 font-medium">Caccia, Cainelli, Lapenta, Olmos</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">TECNOLOGÍA:</span>
              <span className="text-slate-700">React 19, TypeScript, Vite, Tailwind</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">BACKEND API:</span>
              <span className="text-slate-700">NestJS / TypeORM / MySQL (Producción)</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">DURACIÓN ESTIMADA:</span>
              <span className="text-slate-700">6 Semanas (3 Sprints)</span>
            </div>
          </div>

          {/* Sección 1 */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-2">
              1. Resumen Ejecutivo y Objetivos
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm text-justify">
              El presente documento establece la hoja de ruta técnica y organizativa para la implementación del cliente frontend en <strong>React (TypeScript)</strong> para el Club Social y Deportivo "El Globo". El sistema se conecta directamente con la API RESTful desarrollada en <strong>NestJS</strong> y MySQL, garantizando el consumo de datos reales sin datos de prueba en memoria.
            </p>
          </div>

          {/* Sección 2 */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-2">
              2. Arquitectura del Frontend
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm mb-2">
              Se implementa una arquitectura moderna de Aplicación de Página Única (SPA) conectada directamente al backend NestJS mediante Axios.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700 pl-2">
              <li><strong>Bundler & Runtime:</strong> Vite + React 19 / TypeScript.</li>
              <li><strong>Estilos & UI:</strong> Tailwind CSS + Lucide Icons para una interfaz moderna y responsiva.</li>
              <li><strong>Gestión de Estado:</strong> React Context API alimentado exclusivamente desde los endpoints HTTP del servidor.</li>
              <li><strong>Cliente HTTP:</strong> Instancia de Axios con interceptores que inyectan el token JWT (<code>Authorization: Bearer &lt;token&gt;</code>) en cada petición.</li>
            </ul>
          </div>

          {/* Sección 3: Cronograma */}
          <div className="mb-6 overflow-x-auto">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-3">
              3. Cronograma de Implementación por Fases (6 Semanas)
            </h2>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-[#2B6CB0] text-white uppercase text-[11px] font-semibold tracking-wider">
                  <th className="p-2.5 border border-slate-300">Fase / Sprint</th>
                  <th className="p-2.5 border border-slate-300 w-24">Semanas</th>
                  <th className="p-2.5 border border-slate-300">Entregables Principales</th>
                  <th className="p-2.5 border border-slate-300">Módulos Cubiertos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 1: Setup y Autenticación API</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 1</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Integración del cliente Axios con la API NestJS.<br />
                    • Autenticación basada en tokens JWT.<br />
                    • Protección de rutas mediante Guardias (RBAC).
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">Autenticación y Sesión</td>
                </tr>
                <tr className="bg-slate-50/70 hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 2: Padrón y Categorización BD</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 2</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • ABMC de Socios persitiendo en la BD de MySQL.<br />
                    • Categorización automática (Cadete, Activo, Vitalicio).<br />
                    • Plan Grupo Familiar conectado a la base de datos.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">Padrón de Socios BD</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 3: Infraestructura y Deportes</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 3</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Carga de Actividades y Disciplinas desde la API.<br />
                    • Control de Asistencias e Inscripciones.<br />
                    • Estado en tiempo real de los 100 casilleros del club.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">Actividades y Casilleros</td>
                </tr>
                <tr className="bg-slate-50/70 hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 4: Cobranza, Zonas y Rendiciones</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 4</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Emisión de comprobantes desde el servidor.<br />
                    • Asignación de Zonas de Cobro y Cobradores.<br />
                    • Liquidaciones semanales con 10% de comisión.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">Cobranza y Tesorería</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 4: Matriz RBAC */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-3">
              4. Matriz de Componentes Frontend y Control de Acceso (RBAC)
            </h2>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-4">
              <thead>
                <tr className="bg-[#2B6CB0] text-white uppercase text-[11px] font-semibold">
                  <th className="p-2.5 border border-slate-300">Módulo Frontend</th>
                  <th className="p-2.5 border border-slate-300">Componentes Clave</th>
                  <th className="p-2.5 border border-slate-300">Roles Permitidos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">Panel de Socios</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">SocioList, SocioFormModal, FamiliarModal</td>
                  <td className="p-2 border border-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#805AD5]">ADMIN</span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-300 font-bold">Gestión de Cobranza</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">RendicionCobrador, ReciboModal</td>
                  <td className="p-2 border border-slate-300 space-x-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#805AD5]">ADMIN</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#DD6B20]">COBRADOR</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">Portal del Socio</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">SocioPortal, ReciboModal</td>
                  <td className="p-2 border border-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#3182CE]">SOCIO</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Callout Morosidad */}
            <div className="bg-[#EBF8FF] border-l-4 border-[#3182CE] p-3 rounded-r text-xs text-slate-800">
              <div className="font-bold text-[#2B6CB0] flex items-center space-x-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-[#C53030]" />
                <span>Regla de Negocio - Control de Morosidad:</span>
              </div>
              <p className="leading-normal">
                Si la API reporta que el socio acumula meses impagos, el sistema bloqueará las opciones de inscripción a actividades, alquiler de casilleros y mostrará la alerta de suspensión temporal hasta que se regularice la deuda mediante el cobrador de zona o en la sede (Zona 0).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Club Social y Deportivo El Globo • Caccia, Cainelli, Lapenta, Olmos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A365D] text-white rounded font-medium hover:bg-[#2B6CB0] transition-colors cursor-pointer"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};