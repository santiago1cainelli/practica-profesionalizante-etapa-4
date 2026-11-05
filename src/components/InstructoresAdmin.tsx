import React, { useState, useMemo } from 'react';
import {
  Trophy,
  UserCheck,
  UserX,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowLeft,
  X,
  Briefcase,
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { instructores } from '../types';

export type ModalidadInstructor = 'PLANTA_PERMANENTE' | 'HONORARIOS' | 'POR_HORA';

export type InstructorData = instructores & {
  nombreCompleto?: string;
  dni?: string;
  tituloProfesional?: string;
  disciplinasIds?: string[];
  modalidadContrato?: ModalidadInstructor;
  remuneracionMensual?: number;
  diasDisponibles?: string[];
  activo?: boolean;
  fechaAlta?: string;
  observaciones?: string;
};

export const InstructoresAdmin: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    instructores,
    actividades,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    toggleInstructorEstado,
  } = useApp();

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('TODAS');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Estado del modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorData | null>(null);

  // Estado del modal de confirmación de eliminación
  const [instructorToDelete, setInstructorToDelete] = useState<InstructorData | null>(null);

  // Formulario
  const [formData, setFormData] = useState<{
    nombreCompleto: string;
    dni: string;
    telefono: string;
    email: string;
    tituloProfesional: string;
    disciplinasIds: string[];
    modalidadContrato: ModalidadInstructor;
    remuneracionMensual: number;
    diasDisponibles: string[];
    activo: boolean;
    observaciones: string;
  }>({
    nombreCompleto: '',
    dni: '',
    telefono: '',
    email: '',
    tituloProfesional: '',
    disciplinasIds: [],
    modalidadContrato: 'PLANTA_PERMANENTE',
    remuneracionMensual: 350000,
    diasDisponibles: ['Lunes', 'Miércoles', 'Viernes'],
    activo: true,
    observaciones: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];

  // Control de Acceso Estricto RBAC: Solo ADMINISTRADOR
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center max-w-2xl mx-auto my-12 animate-in fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido a Administradores</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          El módulo de Gestión de Instructores y Cuerpo Técnico Deportivo es de acceso exclusivo para la Secretaría y Comisión Directiva con rol de <strong>ADMINISTRADOR</strong>.
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

  // Filtrado de Instructores desde la API / BD
  const filteredInstructores = useMemo(() => {
    return instructores.filter((inst) => {
      const nombreNorm = inst.nombreCompleto || `${(inst as any).nombre || ''} ${(inst as any).apellido || ''}`.trim();
      const dniNorm = inst.dni || '';
      const tituloNorm = inst.tituloProfesional || (inst as any).especialidad || '';
      const emailNorm = inst.email || '';
      const telNorm = inst.telefono || '';
      const disciplinasArr = (inst.disciplinasIds || (inst as any).actividadesIds || []).map(String);

      const matchSearch =
        nombreNorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dniNorm.includes(searchTerm) ||
        tituloNorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emailNorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        telNorm.includes(searchTerm);

      const matchDisciplina =
        filtroDisciplina === 'TODAS' || disciplinasArr.includes(String(filtroDisciplina));

      const matchModalidad =
        filtroModalidad === 'TODAS' || inst.modalidadContrato === filtroModalidad;

      const isActivo = inst.activo ?? true;
      const matchEstado =
        filtroEstado === 'TODOS' ||
        (filtroEstado === 'ACTIVOS' && isActivo) ||
        (filtroEstado === 'INACTIVOS' && !isActivo);

      return matchSearch && matchDisciplina && matchModalidad && matchEstado;
    });
  }, [instructores, searchTerm, filtroDisciplina, filtroModalidad, filtroEstado]);

  // KPIs
  const totalInstructores = instructores.length;
  const activosCount = instructores.filter((i) => (i.activo ?? true)).length;
  const disciplinasAsignadasCount = new Set(
    instructores.flatMap((i) => i.disciplinasIds || (i as any).actividadesIds || [])
  ).size;

  const handleOpenCreateModal = () => {
    setEditingInstructor(null);
    setFormData({
      nombreCompleto: '',
      dni: '',
      telefono: '',
      email: '',
      tituloProfesional: '',
      disciplinasIds: [],
      modalidadContrato: 'PLANTA_PERMANENTE',
      remuneracionMensual: 350000,
      diasDisponibles: ['Lunes', 'Miércoles', 'Viernes'],
      activo: true,
      observaciones: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inst: InstructorData) => {
    setEditingInstructor(inst);
    const nombreNorm = inst.nombreCompleto || `${(inst as any).nombre || ''} ${(inst as any).apellido || ''}`.trim();
    const disciplinasArr = (inst.disciplinasIds || (inst as any).actividadesIds || []).map(String);

    setFormData({
      nombreCompleto: nombreNorm,
      dni: inst.dni || '',
      telefono: inst.telefono || '',
      email: inst.email || '',
      tituloProfesional: inst.tituloProfesional || (inst as any).especialidad || '',
      disciplinasIds: disciplinasArr,
      modalidadContrato: inst.modalidadContrato || 'PLANTA_PERMANENTE',
      remuneracionMensual: Number(inst.remuneracionMensual || (inst as any).montoMensual || 0),
      diasDisponibles: inst.diasDisponibles || ['Lunes', 'Miércoles', 'Viernes'],
      activo: inst.activo ?? true,
      observaciones: inst.observaciones || '',
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
    if (!formData.tituloProfesional.trim()) {
      errors.tituloProfesional = 'El título profesional o especialidad es obligatorio';
    }
    if (formData.remuneracionMensual < 0) {
      errors.remuneracionMensual = 'La remuneración no puede ser negativa';
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
      tituloProfesional: formData.tituloProfesional.trim(),
      especialidad: formData.tituloProfesional.trim(),
      disciplinasIds: formData.disciplinasIds,
      actividadesIds: formData.disciplinasIds,
      modalidadContrato: formData.modalidadContrato,
      remuneracionMensual: Number(formData.remuneracionMensual),
      sueldo: Number(formData.remuneracionMensual),
      montoMensual: Number(formData.remuneracionMensual),
      diasDisponibles: formData.diasDisponibles,
      activo: formData.activo,
      observaciones: formData.observaciones.trim() || undefined,
    };

    if (editingInstructor) {
      await updateInstructor(String(editingInstructor.id), payload as any);
    } else {
      await addInstructor(payload as any);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (instructorToDelete) {
      await deleteInstructor(String(instructorToDelete.id));
      setInstructorToDelete(null);
    }
  };

  const toggleDisciplina = (actId: string) => {
    setFormData((prev) => {
      const exists = prev.disciplinasIds.includes(actId);
      if (exists) {
        return { ...prev, disciplinasIds: prev.disciplinasIds.filter((id) => id !== actId) };
      } else {
        return { ...prev, disciplinasIds: [...prev.disciplinasIds, actId] };
      }
    });
  };

  const toggleDia = (dia: string) => {
    setFormData((prev) => {
      const exists = prev.diasDisponibles.includes(dia);
      if (exists) {
        return { ...prev, diasDisponibles: prev.diasDisponibles.filter((d) => d !== dia) };
      } else {
        return { ...prev, diasDisponibles: [...prev.diasDisponibles, dia] };
      }
    });
  };

  const getModalidadLabel = (mod: ModalidadInstructor) => {
    switch (mod) {
      case 'PLANTA_PERMANENTE':
        return { label: 'Planta Permanente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'HONORARIOS':
        return { label: 'Honorarios / Contrato', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'POR_HORA':
        return { label: 'Arancel por Hora', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: mod || 'Planta Permanente', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Botón Nuevo */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A365D] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Gestión de Instructores BD
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                  Módulo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alta, baja, actualización y asignación de disciplinas deportivas persistidas en la BD de MySQL
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Instructor</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuerpo Docente</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalInstructores}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Instructores en nómina BD</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">En Actividad</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activosCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dictando clases regulares</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deportes Asignados</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{disciplinasAsignadasCount} / {actividades.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Disciplinas con profesor</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Secretaría de Deportes</p>
            <p className="text-2xl font-black text-amber-600 mt-1">100%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cobertura institucional</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, título o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro Deporte */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Deporte:</span>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
            >
              <option value="TODAS">Todas las Disciplinas</option>
              {actividades.map((act) => (
                <option key={act.id} value={String(act.id)}>
                  {act.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Contrato */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Contrato:</span>
            <select
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
            >
              <option value="TODAS">Todas las Modalidades</option>
              <option value="PLANTA_PERMANENTE">Planta Permanente</option>
              <option value="HONORARIOS">Honorarios / Contrato</option>
              <option value="POR_HORA">Arancel por Hora</option>
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

          {(searchTerm || filtroDisciplina !== 'TODAS' || filtroModalidad !== 'TODAS' || filtroEstado !== 'TODOS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroDisciplina('TODAS');
                setFiltroModalidad('TODAS');
                setFiltroEstado('TODOS');
              }}
              className="px-2 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Instructores */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Instructor / Docente</th>
                <th className="py-3.5 px-4">Disciplinas Asignadas</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Contrato & Remuneración</th>
                <th className="py-3.5 px-4">Días Disponibles</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredInstructores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No se encontraron instructores registrados en la BD con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                filteredInstructores.map((inst) => {
                  const nombreNorm = inst.nombreCompleto || `${(inst as any).nombre || ''} ${(inst as any).apellido || ''}`.trim();
                  const tituloNorm = inst.tituloProfesional || (inst as any).especialidad || 'Instructor';
                  const remuNorm = Number(inst.remuneracionMensual || (inst as any).montoMensual || 0);
                  const isActivo = inst.activo ?? true;
                  const modBadge = getModalidadLabel(inst.modalidadContrato);

                  const disciplinasArr = (inst.disciplinasIds || (inst as any).actividadesIds || []).map(String);
                  const actividadesAsignadas = actividades.filter((a) =>
                    disciplinasArr.includes(String(a.id))
                  );

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {nombreNorm.replace('Prof. ', '').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{nombreNorm}</p>
                            <p className="text-[11px] text-teal-700 font-medium flex items-center space-x-1 mt-0.5">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span>{tituloNorm}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              DNI: {inst.dni || 'N/A'} • Legajo ID: #{inst.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {actividadesAsignadas.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Sin deportes asignados</span>
                          ) : (
                            actividadesAsignadas.map((act) => (
                              <span
                                key={act.id}
                                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {act.nombre}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{inst.telefono || 'Sin registrar'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[170px]">{inst.email || 'Sin registrar'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${modBadge.color}`}
                          >
                            {modBadge.label}
                          </span>
                          <div className="text-[11px] font-mono font-bold text-slate-700 flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            <span>${remuNorm.toLocaleString('es-AR')}/mes</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {(inst.diasDisponibles || ['Lunes', 'Miércoles', 'Viernes']).map((dia: string) => (
                            <span
                              key={dia}
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {dia.slice(0, 2)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleInstructorEstado(String(inst.id))}
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

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(inst)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Editar legajo del instructor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInstructorToDelete(inst)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar instructor de la BD"
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

      {/* Modal Alta / Edición de Instructor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1A365D] text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-white" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {editingInstructor ? `Editar Legajo #${editingInstructor.id}` : 'Registrar Nuevo Instructor en BD'}
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
                  placeholder="ej. Valeria Fontana"
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

              {/* Título Profesional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título Profesional / Especialidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Lic. en Educación Física y Entrenador CABB"
                  value={formData.tituloProfesional}
                  onChange={(e) => setFormData({ ...formData, tituloProfesional: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.tituloProfesional ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.tituloProfesional && (
                  <p className="text-[11px] text-red-600 mt-1">{formErrors.tituloProfesional}</p>
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
                    placeholder="ej. 32401889"
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
                    placeholder="ej. 011 15-5120-7788"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.telefono ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.telefono && <p className="text-[11px] text-red-600 mt-1">{formErrors.telefono}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="profesor@clubelglobo.com.ar"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              {/* Asignación de Disciplinas Deportivas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Disciplinas / Actividades Deportivas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                  {actividades.map((act) => {
                    const actIdStr = String(act.id);
                    const isChecked = formData.disciplinasIds.includes(actIdStr);
                    return (
                      <label
                        key={act.id}
                        className={`flex items-center space-x-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-100/70 font-semibold text-blue-900' : 'hover:bg-slate-200/50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDisciplina(actIdStr)}
                          className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D]"
                        />
                        <span className="truncate">{act.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modalidad de Contrato y Remuneración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidad de Contratación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.modalidadContrato}
                    onChange={(e) => setFormData({ ...formData, modalidadContrato: e.target.value as ModalidadInstructor })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] bg-white text-slate-800"
                  >
                    <option value="PLANTA_PERMANENTE">Planta Permanente</option>
                    <option value="HONORARIOS">Honorarios / Monotributo</option>
                    <option value="POR_HORA">Arancel por Hora Cátedra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remuneración Mensual ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={formData.remuneracionMensual}
                      onChange={(e) => setFormData({ ...formData, remuneracionMensual: Number(e.target.value) })}
                      className={`w-full pl-7 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                        formErrors.remuneracionMensual ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {formErrors.remuneracionMensual && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.remuneracionMensual}</p>
                  )}
                </div>
              </div>

              {/* Días Disponibles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Días de Disponibilidad
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = formData.diasDisponibles.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(dia)}
                        className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A365D] text-white border-[#1A365D]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="instructorActivo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D]"
                />
                <label htmlFor="instructorActivo" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Instructor habilitado y activo en nómina de la BD
                </label>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Antecedentes
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre acreditaciones deportivas y seguros..."
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
                  {editingInstructor ? 'Guardar Cambios en BD' : 'Confirmar Alta en BD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {instructorToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">¿Eliminar Instructor de la BD?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el registro de{' '}
              <strong>
                {instructorToDelete.nombreCompleto ||
                  `${(instructorToDelete as any).nombre || ''} ${
                    (instructorToDelete as any).apellido || ''
                  }`}
              </strong>
              ? La acción eliminará el legajo de la base de datos de MySQL.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setInstructorToDelete(null)}
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