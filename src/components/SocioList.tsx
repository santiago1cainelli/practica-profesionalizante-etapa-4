import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Users2,
  Receipt,
  Edit,
  Trash2,
  CheckCircle2,
  Grid,
  ShieldAlert,
  MapPin,
  Calendar,
  Banknote,
  LayoutGrid,
  List
} from 'lucide-react';
import { socios, actividades } from '../types';
import { useApp } from '../context/AppContext';
import { SocioFormModal } from './SocioFormModal';
import { FamiliarModal } from './FamiliarModal';

export const SocioList: React.FC = () => {
  const {
    socios,
    actividades,
    cobradores,
    deleteSocio,
    generarCuponMesActual,
    regularizarDeudaSocio,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedZona, setSelectedZona] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [socioToEdit, setSocioToEdit] = useState<Socio | null>(null);
  const [socioFamilia, setSocioFamilia] = useState<Socio | null>(null);

  // Helper para obtener el nombre de la Zona desde los Cobradores de la BD
  const getNombreZona = (zonaCobro: number) => {
    if (zonaCobro === 0) return 'Zona 0 - Sede Central';
    const cobrador = cobradores.find((c) => Number(c.zona) === Number(zonaCobro));
    return cobrador
      ? `Zona ${zonaCobro} - ${cobrador.nombre} ${cobrador.apellido}`
      : `Zona ${zonaCobro}`;
  };

  // Helper para calcular la cuota estimada de un socio según BD
  const getCuotaInfo = (socio: Socio) => {
    const cuotaBase = (socio as any).montoCuotaSocial ?? 0;

    const actividadesSocio = (socio.actividadesIds || [])
      .map((actId) => actividades.find((a) => String(a.id) === String(actId)))
      .filter(Boolean) as Actividad[];

    const costoActividades = actividadesSocio.reduce(
      (sum, a) => sum + Number((a as any).costoMensual || a.arancel || 0),
      0
    );
    const costoCasillero = socio.casilleroAsignadoId ? Number((socio as any).costoCasillero || 2500) : 0;
    const hijosCount = (socio.familiares || []).filter(
      (f) => f.parentesco === 'HIJO' || f.parentesco === 'HIJA'
    ).length;
    
    const subtotal = Math.max(0, cuotaBase + costoActividades + costoCasillero);

    return {
      cuotaBase,
      costoActividades,
      costoCasillero,
      descuentoFamiliar: 0,
      totalMensual: subtotal,
      actividadesSocio,
    };
  };

  // Lógica de filtrado
  const filteredSocios = socios.filter((s) => {
    const term = searchTerm.toLowerCase();
    const nombreCompleto = s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`;
    const numeroSocio = (s.numeroSocio || s.id || '').toString();

    const matchesSearch =
      nombreCompleto.toLowerCase().includes(term) ||
      (s.dni && s.dni.includes(term)) ||
      numeroSocio.includes(term);

    const matchesCategoria = selectedCategoria === 'TODAS' || s.categoria === selectedCategoria;
    const matchesEstado = selectedEstado === 'TODOS' || s.estado === selectedEstado;
    const matchesZona = selectedZona === 'TODAS' || s.zonaCobro?.toString() === selectedZona;

    return matchesSearch && matchesCategoria && matchesEstado && matchesZona;
  });

  const handleEdit = (socio: Socio) => {
    setSocioToEdit(socio);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSocioToEdit(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string | number, nombre: string) => {
    if (window.confirm(`¿Está seguro de dar de baja al socio ${nombre}?`)) {
      deleteSocio(String(id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-[#C53030]" />
            <span>Padrón de Socios y Categorización</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión completa de socios, valores de cuota mensual, categorías y grupo familiar.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Alternar Vista */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1A365D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#1A365D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabla</span>
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Alta Nuevo Socio</span>
          </button>
        </div>
      </div>

      {/* Resumen de Aranceles Oficiales */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1A365D] to-slate-900 text-white p-4 rounded-xl shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>Valores Oficiales de Cuotas Sociales</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-400/30">
                BD Sincronizada
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Aranceles mensuales registrados en la base de datos según categoría
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase block font-semibold">Activo (&ge;18)</span>
            <span className="font-mono font-bold text-sm text-emerald-300">Categoría Activo</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase block font-semibold">Cadete (&lt;18)</span>
            <span className="font-mono font-bold text-sm text-amber-300">Categoría Cadete</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase block font-semibold">Vitalicio (&gt;30a)</span>
            <span className="font-mono font-bold text-sm text-purple-200">Exento ($0)</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Casillero / Mes</span>
            <span className="font-mono font-bold text-sm text-slate-200">Arancel Fijo</span>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, DNI o N°..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Categoria */}
        <div>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Categorías</option>
            <option value="CADETE">Cadetes (&lt; 18 años)</option>
            <option value="ACTIVO">Activos (&ge; 18 años)</option>
            <option value="VITALICIO">Vitalicios (&gt; 30 años) - Exento ($0)</option>
          </select>
        </div>

        {/* Estado Morosidad */}
        <div>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Activo / Al Día</option>
            <option value="MOROSO">Moroso</option>
            <option value="SUSPENDIDO">Suspendido por Morosidad</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>

        {/* Zona */}
        <div>
          <select
            value={selectedZona}
            onChange={(e) => setSelectedZona(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Zonas</option>
            <option value="0">Zona 0 - Sede Central</option>
            <option value="1">Zona 1</option>
            <option value="2">Zona 2</option>
            <option value="3">Zona 3</option>
          </select>
        </div>
      </div>

      {/* Vista Tarjetas */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSocios.map((socio) => {
            const isSuspended = socio.estado === 'SUSPENDIDO' || socio.estado === 'BAJA';
            const isDeudor = socio.estado === 'MOROSO';
            const nombreCompleto = socio.nombreCompleto || `${socio.nombre} ${socio.apellido}`;
            const numeroSocio = socio.numeroSocio || socio.id;
            const cuotaInfo = getCuotaInfo(socio);

            return (
              <div
                key={socio.id}
                className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isSuspended
                    ? 'border-red-300 bg-red-50/20 hover:border-red-400'
                    : isDeudor
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Encabezado: Número y Categoría */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      SOCIO N° {numeroSocio}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          socio.categoria === 'CADETE'
                            ? 'bg-amber-100 text-amber-800'
                            : socio.categoria === 'VITALICIO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {socio.categoria}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuspended
                            ? 'bg-red-600 text-white'
                            : isDeudor
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {socio.estado}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y DNI */}
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {nombreCompleto}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mb-2">DNI: {socio.dni}</p>

                  {/* Valor de Cuota del Socio */}
                  <div className="mb-3 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Cuota Social Mensual
                          </div>
                          <div className="text-sm font-mono font-black text-emerald-950">
                            {cuotaInfo.cuotaBase > 0 ? (
                              <span>${cuotaInfo.cuotaBase.toLocaleString('es-AR')}<span className="text-[11px] font-normal text-emerald-700">/mes</span></span>
                            ) : (
                              <span className="text-purple-800 font-bold">$0 <span className="text-[10px] font-medium text-purple-600">(Exento)</span></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {cuotaInfo.totalMensual !== cuotaInfo.cuotaBase && (
                        <div className="text-right pl-2 border-l border-emerald-200">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">
                            Total c/ aranceles
                          </div>
                          <div className="text-sm font-mono font-black text-slate-900">
                            ${cuotaInfo.totalMensual.toLocaleString('es-AR')}
                            <span className="text-[10px] font-normal text-slate-500">/mes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de Detalles */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Alta: {socio.fechaAlta ? socio.fechaAlta.slice(0, 10) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{getNombreZona(socio.zonaCobro)}</span>
                    </div>

                    {socio.casilleroAsignadoId && (
                      <div className="flex items-center space-x-1.5 text-blue-700 font-semibold">
                        <Grid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Casillero N° {socio.casilleroAsignadoId} asignado</span>
                      </div>
                    )}

                    {socio.familiares && socio.familiares.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Users2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{socio.familiares.length} familiar(es) vinculados</span>
                      </div>
                    )}
                  </div>

                  {/* Alerta si está suspendido o moroso */}
                  {(isSuspended || isDeudor) && (
                    <div className="mb-3 p-2 bg-red-100/70 border border-red-300 rounded text-[11px] text-red-800 flex items-start space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Estado {socio.estado}:</strong> Registra meses impagos ({socio.mesesImpagosConsecutivos || 0}).
                      </span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSocioFamilia(socio)}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2B6CB0] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                      title="Administrar Grupo Familiar"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      <span>Familia ({socio.familiares?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => generarCuponMesActual(String(socio.id))}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      title="Emitir Cupón de Pago Mes en Curso"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(socio)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      title="Editar Datos"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(socio.id, nombreCompleto)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Dar de Baja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {(isSuspended || isDeudor) && (
                    <button
                      onClick={() => regularizarDeudaSocio(String(socio.id))}
                      className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Regularizar Deuda</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Socio</th>
                  <th className="py-3 px-4">Nombre y DNI</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-emerald-800">Cuota Social</th>
                  <th className="py-3 px-4">Total Mensual</th>
                  <th className="py-3 px-4">Zona Cobro</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSocios.map((socio) => {
                  const isSuspended = socio.estado === 'SUSPENDIDO' || socio.estado === 'BAJA';
                  const isDeudor = socio.estado === 'MOROSO';
                  const nombreCompleto = socio.nombreCompleto || `${socio.nombre} ${socio.apellido}`;
                  const numeroSocio = socio.numeroSocio || socio.id;
                  const cuotaInfo = getCuotaInfo(socio);

                  return (
                    <tr
                      key={socio.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-red-50/30' : isDeudor ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{numeroSocio}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{nombreCompleto}</div>
                        <div className="text-[11px] text-slate-400 font-mono">DNI: {socio.dni}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            socio.categoria === 'CADETE'
                              ? 'bg-amber-100 text-amber-800'
                              : socio.categoria === 'VITALICIO'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {socio.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-emerald-700">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {cuotaInfo.cuotaBase > 0
                              ? `$${cuotaInfo.cuotaBase.toLocaleString('es-AR')}/mes`
                              : '$0 (Exento)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${cuotaInfo.totalMensual.toLocaleString('es-AR')}
                        <span className="text-[10px] font-normal text-slate-500">/mes</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {getNombreZona(socio.zonaCobro)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-red-600 text-white'
                              : isDeudor
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {socio.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSocioFamilia(socio)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#2B6CB0] rounded transition-colors"
                            title="Plan Familiar"
                          >
                            <Users2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generarCuponMesActual(String(socio.id))}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Emitir Cupón"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(socio)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Editar Datos"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(socio.id, nombreCompleto)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Dar de Baja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSocios.length === 0 && (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h4 className="text-base font-bold text-slate-700">No se encontraron socios</h4>
          <p className="text-xs text-slate-500">Intente modificar los filtros o la búsqueda.</p>
        </div>
      )}

      {/* Modals */}
      <SocioFormModal
        isOpen={isFormOpen}
        socioToEdit={socioToEdit}
        onClose={() => setIsFormOpen(false)}
      />

      <FamiliarModal
        socio={socioFamilia}
        onClose={() => setSocioFamilia(null)}
      />
    </div>
  );
};