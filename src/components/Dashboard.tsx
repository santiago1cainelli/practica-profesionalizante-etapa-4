import React from 'react';
import {
  Users,
  Grid,
  Trophy,
  Receipt,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES, CUOTA_VALORES } from '../data/mockData';
import sportsHeroBg from '../assets/images/admin_sports_hero_1789672449602.jpg';

export const Dashboard: React.FC = () => {
  const { socios, lockers, actividades, cupones, rendiciones, setActiveTab, currentUser } = useApp();

  // Stats calculation
  const totalSocios = socios.length;
  const cadetes = socios.filter((s) => s.categoria === 'CADETE').length;
  const activos = socios.filter((s) => s.categoria === 'ACTIVO').length;
  const vitalicios = socios.filter((s) => s.categoria === 'VITALICIO').length;

  const morosos = socios.filter((s) => s.estado === 'SUSPENDIDO_MOROSIDAD');
  const deudores1Mes = socios.filter((s) => s.estado === 'DEUDOR_1_MES');

  const lockersOcupados = lockers.filter((l) => l.estado === 'OCUPADO').length;
  const lockersDisponibles = lockers.filter((l) => l.estado === 'DISPONIBLE').length;

  const totalRecaudadoMes = cupones
    .filter((c) => c.estadoPago === 'PAGADO')
    .reduce((acc, c) => acc + c.totalPagar, 0);

  const totalPendienteMes = cupones
    .filter((c) => c.estadoPago === 'PENDIENTE' || c.estadoPago === 'VENCIDO')
    .reduce((acc, c) => acc + c.totalPagar, 0);

  const rendicionesPendientes = rendiciones.filter((r) => r.estado === 'PENDIENTE_SECRETARIA');

  return (
    <div className="space-y-6">
      
      {/* Sports Hero Banner - Administrator */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
        {/* Background Sports Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={sportsHeroBg}
            alt="Deportes y disciplinas en Club El Globo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-100"
          />
          {/* Sports atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-[#1A365D]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Red and blue ambient flare */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-6 sm:p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#C53030] text-white shadow-sm flex items-center space-x-1">
                <Flame className="w-3 h-3" />
                <span>Panel Administrativo</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/15 backdrop-blur-xs text-slate-200 border border-white/20">
                Temporada 2026 • 6 Disciplinas Activas
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-sans drop-shadow-sm text-white uppercase">
              Club Social y Deportivo "El Globo"
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed max-w-2xl">
              Bienvenido, <strong>{currentUser.nombreCompleto}</strong>. Gestión centralizada de padrón de socios, 
              control de disciplinas deportivas federadas, matriz de 100 casilleros y cobranza por zonas (0 a 3).
            </p>

            {/* Micro badges for key sports metrics */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{actividades.length} Actividades Federadas</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{totalSocios} Socios en Padrón</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                <span>{lockersOcupados}/100 Casilleros en Uso</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('socios')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-[#1A365D] font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4 text-[#C53030]" />
              <span>Gestionar Padrón</span>
            </button>
            <button
              onClick={() => setActiveTab('actividades')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Disciplinas & Horarios</span>
            </button>
            <button
              onClick={() => setActiveTab('cobranza')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Cobranza por Zonas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner if there are Suspended Delinquent Members (R10) */}
      {morosos.length > 0 && (
        <div className="bg-red-50 border-l-4 border-[#C53030] p-4 rounded-r-lg shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#C53030] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                Alerta de Morosidad Crítica (Regla R10): {morosos.length} {morosos.length === 1 ? 'socio suspendido' : 'socios suspendidos'}
              </h3>
              <p className="text-xs text-red-700">
                Socios con 2 o más cuotas consecutivas adeudadas tienen el acceso bloqueado a casilleros y nuevas inscripciones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('morosidad')}
            className="px-3.5 py-1.5 bg-[#C53030] hover:bg-red-800 text-white rounded-md text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <span>Ver Panel de Morosidad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Padrón */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Padrón de Socios</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSocios}</div>
            </div>
            <div className="p-2.5 bg-blue-50 text-[#2B6CB0] rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Cadetes</span>
              <strong className="text-slate-700">{cadetes}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Activos</span>
              <strong className="text-slate-700">{activos}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Vitalicios</span>
              <strong className="text-slate-700">{vitalicios}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: 100 Casilleros */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grilla Casilleros</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {lockersOcupados} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Grid className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>Disponibles: <strong className="text-emerald-700">{lockersDisponibles}</strong></span>
            <button
              onClick={() => setActiveTab('casilleros')}
              className="text-[#2B6CB0] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Ver Grilla</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Recaudación */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recaudación Cobrada</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ${totalRecaudadoMes.toLocaleString('es-AR')}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>Por cobrar: <strong className="text-amber-600">${totalPendienteMes.toLocaleString('es-AR')}</strong></span>
            <button
              onClick={() => setActiveTab('cobranza')}
              className="text-[#2B6CB0] font-semibold hover:underline"
            >
              Ver Zonas
            </button>
          </div>
        </div>

        {/* Card 4: Disciplinas Deportivas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actividades & Cupos</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{actividades.length}</div>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>Instructores activos: <strong>3</strong></span>
            <button
              onClick={() => setActiveTab('actividades')}
              className="text-[#2B6CB0] font-semibold hover:underline"
            >
              Ver vitrina
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Zonas de Cobranza & Rendición Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Zonas de Cobro Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1A365D]">Estado de Cobranza por Zonas (R7 - R8)</h2>
              <p className="text-xs text-slate-500">Distribución de socios y cupones emitidos por radio geográfico</p>
            </div>
            <button
              onClick={() => setActiveTab('cobranza')}
              className="text-xs font-semibold text-[#2B6CB0] hover:underline"
            >
              Ver todos los cupones
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((zonaNum) => {
              const zona = ZONAS_NOMBRES[zonaNum];
              const sociosEnZona = socios.filter((s) => s.zonaCobro === zonaNum);
              const cuponesEnZona = cupones.filter((c) => c.zonaCobro === zonaNum);
              const cobrados = cuponesEnZona.filter((c) => c.estadoPago === 'PAGADO');
              const totalCobradoZona = cobrados.reduce((acc, c) => acc + c.totalPagar, 0);

              return (
                <div key={zonaNum} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1A365D]">{zona.nombre}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      {sociosEnZona.length} socios
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">{zona.descripcion}</p>
                  <div className="text-xs flex justify-between items-center text-slate-700 pt-2 border-t border-slate-200">
                    <span>Cobrado: <strong>${totalCobradoZona.toLocaleString('es-AR')}</strong></span>
                    <span className="text-[11px] text-slate-500">Resp: {zona.cobradorDefault.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rendición Semanal 10% (R9) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#1A365D]">Rendición Cobradores (R9)</h2>
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                10% Comisión
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Liquidaciones semanales presentadas por cobradores a domicilio.
            </p>

            <div className="space-y-3">
              {rendiciones.slice(0, 3).map((rend) => (
                <div key={rend.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <strong className="text-slate-800">{rend.cobradorNombre}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rend.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rend.estado === 'APROBADA' ? 'APROBADA' : 'PENDIENTE'}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">Zona {rend.zonaCobro} • {rend.periodoFecha}</div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center font-mono">
                    <span className="text-slate-500 text-[10px]">Comisión 10%:</span>
                    <span className="text-amber-700 font-bold">${rend.montoComisionCobrador.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rendicion')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Módulo de Rendiciones</span>
          </button>
        </div>
      </div>
    </div>
  );
};
