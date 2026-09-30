import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Grid,
  Trophy,
  Users,
  Receipt,
  Download,
  Calendar,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES } from '../data/mockData';
import { ReciboModal } from './ReciboModal';
import { CuponRecibo } from '../types';
import titularCardBg from '../assets/images/titular_card_bg_1789672816138.jpg';

export const SocioPortal: React.FC = () => {
  const { socios, actividades, cupones, currentUser, unenrollSocioFromActividad, setActiveTab } = useApp();

  // Selected socio (defaults to currentUser.socioId if logged in as socio, or first socio)
  const defaultSocioId = (currentUser.role === 'SOCIO' && currentUser.socioId)
    ? currentUser.socioId
    : (currentUser.socioId || socios[0]?.id || '');
  const [selectedSocioId, setSelectedSocioId] = useState<string>(defaultSocioId);
  const [viewingCupon, setViewingCupon] = useState<CuponRecibo | null>(null);

  // Sync selected socio when user changes or is a socio
  React.useEffect(() => {
    if (currentUser.role === 'SOCIO' && currentUser.socioId) {
      setSelectedSocioId(currentUser.socioId);
    }
  }, [currentUser]);

  // If role is SOCIO, enforce that the socio can only view their own profile
  const effectiveSocioId = (currentUser.role === 'SOCIO' && currentUser.socioId)
    ? currentUser.socioId
    : selectedSocioId;

  const socio = socios.find((s) => s.id === effectiveSocioId) || socios[0];

  if (!socio) {
    return <div className="p-8 text-center text-slate-500">No hay socios en el padrón.</div>;
  }

  const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD';
  const zona = ZONAS_NOMBRES[socio.zonaCobro];
  const misActividades = actividades.filter((a) => socio.actividadesIds.includes(a.id));
  const misCupones = cupones.filter((c) => c.socioId === socio.id);

  return (
    <div className="space-y-6">
      
      {/* Header & Socio Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-600 text-white">
              Portal del Socio
            </span>
            <span className="text-xs text-slate-500 font-medium">Carnet Digital Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-[#C53030]" />
            <span>Credencial Digital & Autogestión</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acceso a instalaciones, estado de cuenta, casillero y disciplinas deportivas.
          </p>
        </div>

        {/* Member selector only visible for Admin testability; Socios only see their own profile */}
        {currentUser.role === 'ADMIN' ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ver como socio:</span>
            <select
              value={socio.id}
              onChange={(e) => setSelectedSocioId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {socios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombreCompleto} (Socio N° {s.numeroSocio})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold">
              Sesión de Socio: {socio.nombreCompleto}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Digital Member Card (Carnet Digital) */}
        <div className="lg:col-span-1">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-900 text-white p-6 flex flex-col justify-between min-h-[440px]">
            {/* Background Image of the Credential */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={titularCardBg}
                alt="Fondo credencial socio titular"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A365D]/95 via-[#0F172A]/90 to-slate-950/95 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full blur-2xl" />
            </div>

            {/* Top Bar with Club Identity */}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#C53030] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20">
                    G
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-wider uppercase leading-none">
                      Club El Globo
                    </h3>
                    <span className="text-[10px] text-blue-200 uppercase tracking-widest block mt-0.5 font-medium">
                      Carnet Digital Oficial
                    </span>
                  </div>
                </div>

                <span className="font-mono text-xs bg-white/10 backdrop-blur-xs px-2 py-1 rounded text-blue-100 font-bold border border-white/10">
                  N° {socio.numeroSocio}
                </span>
              </div>

              {/* Category & Status Banner */}
              <div className="flex items-center space-x-2 mb-4">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    socio.categoria === 'CADETE'
                      ? 'bg-amber-400 text-amber-950'
                      : socio.categoria === 'VITALICIO'
                      ? 'bg-purple-300 text-purple-950'
                      : 'bg-blue-300 text-blue-950'
                  }`}
                >
                  {socio.categoria}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isSuspended ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {isSuspended ? 'SUSPENDIDO (R10)' : 'HABILITADO'}
                </span>
              </div>

              {/* Member Full Name and Details - Dedicated Box with Background Image and Glassmorphism */}
              <div className="relative overflow-hidden rounded-xl border border-white/25 bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-md p-4 mb-4 shadow-lg">
                {/* Dedicated background image thumbnail inside the titular container */}
                <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
                  <img
                    src={titularCardBg}
                    alt="Fondo titular"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center filter brightness-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1A365D]/80 via-transparent to-[#C53030]/30" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase text-red-300 font-bold tracking-wider flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
                      <span>Nombre del Titular</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/15 text-slate-200 uppercase font-bold tracking-wider border border-white/10">
                      Titular Oficial
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                    {socio.nombreCompleto}
                  </h2>
                  <div className="flex items-center justify-between mt-1 text-xs text-blue-200 font-mono">
                    <span>DNI: {socio.dni}</span>
                    <span className="text-[10px] text-slate-300 font-sans">
                      Ingreso: {socio.fechaIngreso.slice(0, 4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-100 bg-black/30 backdrop-blur-xs p-2.5 rounded-lg border border-white/10 mb-4">
                <div>
                  <span className="text-[9px] text-blue-300 block uppercase">Antigüedad</span>
                  <strong>{socio.antiguedadAnios} años</strong>
                </div>
                <div>
                  <span className="text-[9px] text-blue-300 block uppercase">Casillero</span>
                  <strong>{socio.casilleroAsignadoId ? `N° ${socio.casilleroAsignadoId}` : 'Sin asignar'}</strong>
                </div>
              </div>
            </div>

            {/* Bottom Bar: QR Code for Access Turnstiles */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-blue-300 uppercase tracking-widest block">Código de Acceso</span>
                <span className="text-xs font-mono text-white font-bold tracking-widest">
                  GLOBO-{socio.numeroSocio}-{socio.dni.slice(-4)}
                </span>
              </div>

              <div className="bg-white p-1.5 rounded-lg shadow-md flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-2 italic">
            Presente este código QR en el molinete de entrada a la sede.
          </p>
        </div>

        {/* Member Details, Services & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Alert if Suspended */}
          {isSuspended ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-xs text-red-900 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-red-950 mb-0.5">
                  Atención: Acceso Suspendido por Morosidad (R10)
                </strong>
                <p>
                  Usted registra {socio.cuotasAdeudadas} cuotas consecutivas adeudadas. Para habilitar su carnet en los molinetes, hacer uso de su casillero o continuar en sus disciplinas deportivas, por favor regularice su saldo pendiente con el cobrador de zona o en secretaría.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-xs text-emerald-900 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-emerald-950">
                  Cuota al Día • Carnet Habilitado
                </strong>
                <p className="text-emerald-800">
                  Acceso habilitado a todas las instalaciones, vestuarios y actividades inscriptas.
                </p>
              </div>
            </div>
          )}

          {/* Current Enrolled Activities & Lockers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Disciplines */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-[#2B6CB0]" />
                    <span>Mis Disciplinas Deportivas</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('actividades')}
                    className="text-[11px] font-bold text-[#1A365D] hover:text-[#2B6CB0] flex items-center space-x-1"
                  >
                    <span>+ Inscribirme</span>
                  </button>
                </div>

                {misActividades.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <p className="text-slate-400 text-xs mb-2">No estás inscripto en actividades deportivas.</p>
                    <button
                      onClick={() => setActiveTab('actividades')}
                      className="px-3 py-1.5 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded text-xs font-bold transition-colors shadow-xs"
                    >
                      Explorar Vitrina de Deportes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {misActividades.map((act) => (
                      <div key={act.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-slate-900 block">{act.nombre}</strong>
                          <span className="text-[11px] text-slate-500 block">
                            {act.dias.join(', ')} • {act.horario} hs • Prof: {act.instructorNombre}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 font-mono">
                            ${act.costoMensual.toLocaleString('es-AR')}/mes
                          </span>
                        </div>
                        <button
                          onClick={() => unenrollSocioFromActividad(socio.id, act.id)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-semibold transition-colors shrink-0"
                          title="Darse de baja de esta actividad"
                        >
                          Darme de baja
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Family Plan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 mb-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#C53030]" />
                <span>Grupo Familiar Asociado (R4)</span>
              </div>

              {socio.familiares.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No tienes familiares vinculados en tu plan.</p>
              ) : (
                <div className="space-y-2">
                  {socio.familiares.map((fam) => (
                    <div key={fam.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                      <strong className="text-slate-900 block">{fam.nombreCompleto}</strong>
                      <span className="text-[11px] text-slate-500">
                        {fam.parentesco} • DNI: {fam.dni} • {fam.edad} años
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Historial de Comprobantes y Recibos</span>
            </h3>

            {misCupones.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No hay cupones emitidos todavía.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {misCupones.map((cup) => (
                  <div key={cup.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900 block font-mono">{cup.numeroComprobante}</strong>
                      <span className="text-[11px] text-slate-500">
                        Período: {cup.periodoMes} • Vto: {cup.fechaVencimiento}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-800">
                        ${cup.totalPagar.toLocaleString('es-AR')}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cup.estadoPago === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cup.estadoPago === 'VENCIDO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cup.estadoPago}
                      </span>

                      <button
                        onClick={() => setViewingCupon(cup)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        title="Ver e Imprimir Comprobante Oficial"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Recibo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReciboModal cupon={viewingCupon} onClose={() => setViewingCupon(null)} />
    </div>
  );
};
