import React from 'react';
import { X, Printer, Download, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

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
        
        {/* Modal Top Bar */}
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
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
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

        {/* Document Content */}
        <div className="p-8 overflow-y-auto font-sans text-slate-800 text-sm leading-relaxed bg-white print:p-0">
          
          {/* Header Banner Document Replica */}
          <div className="bg-[#1A365D] text-white p-6 rounded-md mb-6 border-b-4 border-[#C53030]">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              PLAN DE IMPLEMENTACIÓN FRONTEND REACT
            </h1>
            <p className="text-sm text-blue-100 font-light">
              Sistema de Gestión Integral — Club Social y Deportivo "El Globo"
            </p>
          </div>

          {/* Meta Grid */}
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
              <span className="text-slate-700">NestJS / TypeORM / MySQL</span>
            </div>
            <div>
              <span className="font-bold text-[#2B6CB0] block">DURACIÓN ESTIMADA:</span>
              <span className="text-slate-700">6 Semanas (3 Sprints)</span>
            </div>
          </div>

          {/* Section 1 */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-2">
              1. Resumen Ejecutivo y Objetivos
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm text-justify">
              El presente documento establece la hoja de ruta técnica y organizativa para la implementación del cliente frontend en <strong>React (TypeScript)</strong> para el Club Social y Deportivo "El Globo". El sistema se conecta directamente con la arquitectura REST desarrollada en <strong>NestJS</strong>, garantizando el cumplimiento de los requerimientos funcionales (R1 a R11) y no funcionales (RBAC, performance, usabilidad y arquitectura multiplataforma).
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-2">
              2. Arquitectura del Frontend
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm mb-2">
              Se implementa una arquitectura moderna tipo Single Page Application (SPA) basada en componentes modulares y gestión centralizada de estado mediante React Context + Hooks.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700 pl-2">
              <li><strong>Bundler & Runtime:</strong> Vite + React 19 / TypeScript.</li>
              <li><strong>Estilos & UI:</strong> Tailwind CSS + Lucide Icons para componentes responsivos e intuitivos.</li>
              <li><strong>Gestión de Estado:</strong> React Context API (Auth, Notificaciones, Estado Global de Cupones/Socios).</li>
              <li><strong>Cliente HTTP:</strong> Axios con interceptores para inyección automática del Header <code>Authorization: Bearer &lt;token&gt;</code> y manejo centralizado de errores 401/403.</li>
              <li><strong>Formularios y Validaciones:</strong> React Hook Form + Zod para validación estricta en el cliente (DNI, CUIT, Emails).</li>
            </ul>
          </div>

          {/* Section 3: Cronograma */}
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
                  <th className="p-2.5 border border-slate-300">Requerimientos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 1: Setup y Autenticación</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 1</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Configuración inicial del repositorio React + Vite.<br />
                    • Cliente Axios con Interceptores JWT.<br />
                    • Pantalla de Login y Guardia de Rutas por Rol (RBAC).
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R1 (Autenticación y Roles RBAC)</td>
                </tr>
                <tr className="bg-slate-50/70 hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 2: Padrón y Categorización</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 2</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Módulo ABMC de Socios (Alta con DNI único).<br />
                    • Cálculo automático de categorías (Cadete &lt;18, Activo &ge;18, Vitalicio &gt;30a).<br />
                    • Gestión del Plan Grupo Familiar y vinculación cónyuge/hijos.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R2, R3, R4 (Plan Familiar)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 3: Infraestructura y Deportes</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 3</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Vitrina pública de Actividades y Filtros.<br />
                    • Panel de Asistencia e Inscripción para Instructores.<br />
                    • Grilla interactiva de 100 Casilleros con vinculación única.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R5 (Actividades), R6 (Casilleros)</td>
                </tr>
                <tr className="bg-slate-50/70 hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 4: Cobranza, Zonas y Recibos</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 4</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Emisión y Cálculo detallado de Recibos (Lógica multiconcepto).<br />
                    • Gestión de Zonas de Cobro (Zona 0 a Zona 3).<br />
                    • Módulo de Liquidación Semanal (10% Comisión Cobradores).
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R7 (Zonas), R8 (Recibos), R9 (10%)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 5: Morosidad y Automatismos</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 5</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Panel de Control de Morosidad (Suspensión automática a los 2 meses).<br />
                    • Reemisión de cupones con 5% de recargo.<br />
                    • Generación de reportes y exportación en PDF.
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R10 (Morosidad), R11 (5% Mora)</td>
                </tr>
                <tr className="bg-slate-50/70 hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300">Fase 6: Testing, QA y Despliegue</td>
                  <td className="p-2.5 border border-slate-300 text-slate-600">Semana 6</td>
                  <td className="p-2.5 border border-slate-300 text-slate-700">
                    • Integración E2E con el Backend NestJS.<br />
                    • Pruebas de carga con 1500 socios simultáneos.<br />
                    • Despliegue en producción (Vercel / Nginx / Cloud Run).
                  </td>
                  <td className="p-2.5 border border-slate-300 font-medium text-blue-800">R2 (Multiplataforma), R3 (QA)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Matriz RBAC */}
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
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">SocioList, SocioFormModal, GrupoFamiliarModal</td>
                  <td className="p-2 border border-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#805AD5]">ADMIN</span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-300 font-bold">Gestión de Cobranza</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">CouponZoneGrid, RendicionForm, ReciboViewer</td>
                  <td className="p-2 border border-slate-300 space-x-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#805AD5]">ADMIN</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#DD6B20]">COBRADOR</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">Asistencia e Instructores</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">ActividadesShowcase, AsistenciaTracker</td>
                  <td className="p-2 border border-slate-300 space-x-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#805AD5]">ADMIN</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#319795]">INSTRUCTOR</span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 border border-slate-300 font-bold">Portal del Socio</td>
                  <td className="p-2 border border-slate-300 font-mono text-[11px] text-slate-600">MiEstadoCuenta, MisActividades, SolicitudCasillero</td>
                  <td className="p-2 border border-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#3182CE]">SOCIO</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Callout R10 */}
            <div className="bg-[#EBF8FF] border-l-4 border-[#3182CE] p-3 rounded-r text-xs text-slate-800">
              <div className="font-bold text-[#2B6CB0] flex items-center space-x-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-[#C53030]" />
                <span>Regla Crítica de Negocio - Control de Morosidad (R10):</span>
              </div>
              <p className="leading-normal">
                Si el socio acumula 2 meses impagos consecutivos, el frontend bloqueará automáticamente las opciones de inscripción a actividades, alquiler de casilleros y mostrará la alerta de suspensión temporal hasta que se regularice la deuda mediante el cobrador de zona o en la sede (Zona 0).
              </p>
            </div>
          </div>

          {/* Section 5: Estrategia de Pruebas */}
          <div>
            <h2 className="text-base font-bold text-[#1A365D] border-b-2 border-slate-200 pb-1.5 mb-2">
              5. Estrategia de Pruebas y Despliegue
            </h2>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700 pl-2">
              <li><strong>Pruebas Unitarias:</strong> Vitest + React Testing Library para validar el cálculo de recibos, recargos del 5% y comisiones del 10%.</li>
              <li><strong>Pruebas de Integración:</strong> Validación de flujos completos de login, emisión de recibo y rendición semanal con Mock Service Worker (MSW) y API real.</li>
              <li><strong>Despliegue Continuo (CI/CD):</strong> Pipeline en GitHub Actions ejecutando linter, build de TypeScript y deploy automatizado.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Club Social y Deportivo El Globo • Caccia, Cainelli, Lapenta, Olmos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A365D] text-white rounded font-medium hover:bg-[#2B6CB0] transition-colors"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};
