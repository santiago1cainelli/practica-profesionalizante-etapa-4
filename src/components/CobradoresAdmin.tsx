import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Percent,
  Calendar,
  ShieldAlert,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cobradores } from '../types';

export type CobradorData = cobradores & {
  nombreCompleto?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  zonaAsignada?: number;
  porcentajeComision?: number;
  activo?: boolean;
  observaciones?: string;
  fechaAlta?: string;
};

export const CobradoresAdmin: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    cobradores,
    addCobrador,
    updateCobrador,
    deleteCobrador,
    toggleCobradorEstado,
  } = useApp();

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroZona, setFiltroZona] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Estado del modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCobrador, setEditingCobrador] = useState<CobradorData | null>(null);

  // Estado del modal de confirmación de eliminación
  const [cobradorToDelete, setCobradorToDelete] = useState<CobradorData | null>(null);

  // Formulario
  const [formData, setFormData] = useState<{
    nombreCompleto: string;
    dni: string;
    telefono: string;
    email: string;
    direccion: string;
    zonaAsignada: number;
    porcentajeComision: number;
    activo: boolean;
    observaciones: string;
  }>({
    nombreCompleto: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    zonaAsignada: 1,
    porcentajeComision: 10,
    activo: true,
    observaciones: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Control de Acceso Estricto RBAC: Solo ADMINISTRADOR
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center max-w-2xl mx-auto my-12 animate-in fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido a Administradores</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          La gestión de Cobradores y asignación de zonas domiciliarias requiere credenciales de nivel <strong>ADMINISTRADOR</strong>.
          Tu usuario actual ({currentUser?.nombreCompleto}) tiene rol de <span className="font-semibold text-slate-800">[{currentUser?.role}]</span>.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() =>
              setActiveTab(
                currentUser?.role === 'PUBLICO'
                  ? 'inicio'
                  : currentUser?.role === 'SOCIO'
                  ? 'portal_socio'
                  : 'dashboard'
              )
            }
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#1A365D] hover:bg-[#142847] text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la pantalla principal</span>
          </button>
        </div>
      </div>
    );
  }

  // Helper para etiquetas de zonas en BD
  const getZonaNombreLabel = (zonaNum: number) => {
    switch (Number(zonaNum)) {
      case 0:
        return { nombre: 'Zona 0 - Sede Central', descripcion: 'Ventanilla de Tesorería' };
      case 1:
        return { nombre: 'Zona 1 - Centro & Norte', descripcion: 'Radio urbano central' };
      case 2:
        return { nombre: 'Zona 2 - Sur & Estación', descripcion: 'Barrio Sur y Estación' };
      case 3:
        return { nombre: 'Zona 3 - Este & Costanera', descripcion: 'Zona Este y Avenida Costanera' };
      default:
        return { nombre: `Zona ${zonaNum}`, descripcion: `Circuito asignado N° ${zonaNum}` };
    }
  };

  // Filtrado de Cobradores desde BD
  const filteredCobradores = useMemo(() => {
    return cobradores.filter((c) => {
      const nombreNorm = c.nombreCompleto || `${(c as any).nombre || ''} ${(c as any).apellido || ''}`.trim();
      const dniNorm = c.dni || '';
      const emailNorm = c.email || '';
      const telNorm = c.telefono || '';
      const zonaNorm = String(c.zonaAsignada ?? (c as any).zona ?? 0);
      const isActivo = c.activo ?? true;

      const matchSearch =
        nombreNorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dniNorm.includes(searchTerm) ||
        emailNorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        telNorm.includes(searchTerm);

      const matchZona = filtroZona === 'TODAS' || zonaNorm === filtroZona;
      const matchEstado =
        filtroEstado === 'TODOS' ||
        (filtroEstado === 'ACTIVOS' && isActivo) ||
        (filtroEstado === 'INACTIVOS' && !isActivo);

      return matchSearch && matchZona && matchEstado;
    });
  }, [cobradores, searchTerm, filtroZona, filtroEstado]);

  // KPIs
  const totalCobradores = cobradores.length;
  const activosCount = cobradores.filter((c) => (c.activo ?? true)).length;
  const zonasCubiertas = new Set(
    cobradores.filter((c) => (c.activo ?? true)).map((c) => Number(c.zonaAsignada ?? (c as any).zona ?? 0))
  ).size;

  const handleOpenCreateModal = () => {
    setEditingCobrador(null);
    setFormData({
      nombreCompleto: '',
      dni: '',
      telefono: '',
      email: '',
      direccion: '',
      zonaAsignada: 1,
      porcentajeComision: 10,
      activo: true,
      observaciones: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cobrador: CobradorData) => {
    setEditingCobrador(cobrador);
    const nombreNorm = cobrador.nombreCompleto || `${(cobrador as any).nombre || ''} ${(cobrador as any).apellido || ''}`.trim();
    const comisionNorm = Number(cobrador.porcentajeComision ?? (cobrador as any).comision ?? 0.1);

    setFormData({
      nombreCompleto: nombreNorm,
      dni: cobrador.dni || '',
      telefono: cobrador.telefono || '',
      email: cobrador.email || '',
      direccion: cobrador.direccion || '',
      zonaAsignada: Number(cobrador.zonaAsignada ?? (cobrador as any).zona ?? 1),
      porcentajeComision: comisionNorm > 1 ? comisionNorm : Math.round(comisionNorm * 100),
      activo: cobrador.activo ?? true,
      observaciones: cobrador.observaciones || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.nombreCompleto.trim()) errors.nombreCompleto = 'El nombre completo es obligatorio';
    if (!formData.dni.trim()) {
      errors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{7,9}$/.test(formData.dni.replace(/\D/g, ''))) {
      errors.dni = 'DNI inválido (debe contener entre 7 y 9 dígitos)';
    }
    if (!formData.telefono.trim()) errors.telefono = 'El teléfono de contacto es obligatorio';
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Formato de correo electrónico inválido';
    }
    if (formData.porcentajeComision < 0 || formData.porcentajeComision > 100) {
      errors.porcentajeComision = 'La comisión debe ser entre 0% y 100%';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const partesNombre = formData.nombreCompleto.trim().split(' ');
    const nombre = partesNombre[0];
    const apellido = partesNombre.slice(1).join(' ') || partesNombre[0];

    const payload = {
      nombre,
      apellido,
      nombreCompleto: formData.nombreCompleto.trim(),
      dni: formData.dni.replace(/\D/g, ''),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      correo: formData.email.trim(),
      direccion: formData.direccion.trim() || undefined,
      zonaAsignada: Number(formData.zonaAsignada),
      zona: Number(formData.zonaAsignada),
      porcentajeComision: Number(formData.porcentajeComision) / 100,
      comisionPorcentaje: Number(formData.porcentajeComision),
      comision: Number(formData.porcentajeComision) / 100,
      activo: formData.activo,
      observaciones: formData.observaciones.trim() || undefined,
    };

    if (editingCobrador) {
      await updateCobrador(String(editingCobrador.id), payload as any);
    } else {
      await addCobrador(payload as any);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (cobradorToDelete) {
      await deleteCobrador(String(cobradorToDelete.id));
      setCobradorToDelete(null);
    }
  };

  const getZonaBadgeColor = (zona: number) => {
    switch (Number(zona)) {
      case 0:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 1:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Botón Nuevo */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A365D] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Gestión de Cobradores BD
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                  Módulo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alta, baja, modificación y control de zonas domiciliarias persistidas en MySQL
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Cobrador</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Nómina</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCobradores}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cobradores en BD</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cobradores Activos</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activosCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">En circuito de recaudación</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Zonas Asignadas</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{zonasCubiertas} / 4</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sede Central + Zonas 1, 2, 3</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Comisión Estatutaria</p>
            <p className="text-2xl font-black text-amber-600 mt-1">10%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Por recibo en cobro callejero</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro Zona */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Zona:</span>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
            >
              <option value="TODAS">Todas las Zonas</option>
              <option value="0">Zona 0 (Sede Central)</option>
              <option value="1">Zona 1 (Centro & Norte)</option>
              <option value="2">Zona 2 (Sur & Estación)</option>
              <option value="3">Zona 3 (Este & Costanera)</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Solo Activos</option>
              <option value="INACTIVOS">Solo Inactivos</option>
            </select>
          </div>

          {(searchTerm || filtroZona !== 'TODAS' || filtroEstado !== 'TODOS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroZona('TODAS');
                setFiltroEstado('TODOS');
              }}
              className="px-2 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Cobradores */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Cobrador</th>
                <th className="py-3.5 px-4">Zona Asignada</th>
                <th className="py-3.5 px-4">Contacto Directo</th>
                <th className="py-3.5 px-4 text-center">% Comisión</th>
                <th className="py-3.5 px-4">Fecha de Alta</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCobradores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No se encontraron cobradores en la BD con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                filteredCobradores.map((cobrador) => {
                  const nombreNorm = cobrador.nombreCompleto || `${(cobrador as any).nombre || ''} ${(cobrador as any).apellido || ''}`.trim();
                  const zonaNum = Number(cobrador.zonaAsignada ?? (cobrador as any).zona ?? 0);
                  const zonaInfo = getZonaNombreLabel(zonaNum);
                  const isActivo = cobrador.activo ?? true;
                  const comisionRaw = Number(cobrador.porcentajeComision ?? (cobrador as any).comision ?? 0.1);
                  const porcentajeVal = comisionRaw > 1 ? comisionRaw : Math.round(comisionRaw * 100);

                  return (
                    <tr key={cobrador.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#1A365D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {nombreNorm.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{nombreNorm}</p>
                            <p className="text-[11px] text-slate-500 font-mono">DNI: {cobrador.dni || 'N/A'}</p>
                            {cobrador.direccion && (
                              <p className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[200px]">{cobrador.direccion}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getZonaBadgeColor(
                              zonaNum
                            )}`}
                          >
                            {zonaInfo.nombre}
                          </span>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{zonaInfo.descripcion}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cobrador.telefono || 'Sin registrar'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">{cobrador.email || 'Sin registrar'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-800 text-xs px-2 py-1 bg-slate-100 rounded">
                          {porcentajeVal}%
                        </span>
                        {zonaNum === 0 && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">Ventanilla fija</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{cobrador.fechaAlta || (cobrador as any).fechaIngreso || 'Reciente'}</span>
                        </div>
                        {cobrador.observaciones && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5" title={cobrador.observaciones}>
                            {cobrador.observaciones}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleCobradorEstado(String(cobrador.id))}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                            isActivo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title="Click para alternar estado activo/inactivo"
                        >
                          {isActivo ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(cobrador)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Editar datos del cobrador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCobradorToDelete(cobrador)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar cobrador de la nómina BD"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta / Edición de Cobrador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1A365D] text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-white" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {editingCobrador ? `Editar Cobrador #${editingCobrador.id}` : 'Registrar Nuevo Cobrador en BD'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre y Apellido Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Roberto Gómez"
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.nombreCompleto ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.nombreCompleto && (
                  <p className="text-[11px] text-red-600 mt-1">{formErrors.nombreCompleto}</p>
                )}
              </div>

              {/* DNI y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 24318992"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.dni ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.dni && <p className="text-[11px] text-red-600 mt-1">{formErrors.dni}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 11-4455-8811"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.telefono ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.telefono && <p className="text-[11px] text-red-600 mt-1">{formErrors.telefono}</p>}
                </div>
              </div>

              {/* Email y Dirección */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="cobranzas.zona1@clubelglobo.com.ar"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Domiciliaria
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Libertador 1205"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                  />
                </div>
              </div>

              {/* Zona Asignada y Porcentaje Comisión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zona Asignada <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.zonaAsignada}
                    onChange={(e) => setFormData({ ...formData, zonaAsignada: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] bg-white text-slate-800"
                  >
                    <option value={0}>Zona 0 - Sede Central (Ventanilla)</option>
                    <option value={1}>Zona 1 - Centro & Barrio Norte</option>
                    <option value={2}>Zona 2 - Sur & Estación</option>
                    <option value={3}>Zona 3 - Este & Costanera</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    % Comisión por Recibo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.porcentajeComision}
                      onChange={(e) => setFormData({ ...formData, porcentajeComision: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                        formErrors.porcentajeComision ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                  {formErrors.porcentajeComision && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.porcentajeComision}</p>
                  )}
                </div>
              </div>

              {/* Estado Activo Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activoCheckbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D]"
                />
                <label htmlFor="activoCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Cobrador habilitado y en actividad en la BD
                </label>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre vehículo asignado o disponibilidad horaria..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A365D] hover:bg-[#142847] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingCobrador ? 'Guardar Cambios en BD' : 'Confirmar Alta en BD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {cobradorToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">¿Eliminar Cobrador de la BD?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                {cobradorToDelete.nombreCompleto ||
                  `${(cobradorToDelete as any).nombre || ''} ${
                    (cobradorToDelete as any).apellido || ''
                  }`}
              </strong>{' '}
              (Zona {cobradorToDelete.zonaAsignada ?? (cobradorToDelete as any).zona})? La acción lo removerá de la base de datos de MySQL.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setCobradorToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Sí, Eliminar de la BD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};