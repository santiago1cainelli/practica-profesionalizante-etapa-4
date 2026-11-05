import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  socios,
  casilleros,
  actividades,
  cobradores,
  instructores,
  cupones,
  rendiciones,
  users,
  SocioCategoria,
  SocioEstado,
  TurnoActividad,
  RolGrupoFamiliar,
  EstadoCupon,
} from '../types';

export interface Familiar {
  id?: number | string;
  nombre?: string;
  apellido?: string;
  nombreCompleto?: string;
  dni?: string;
  parentesco?: 'CONYUGE' | 'HIJO' | 'HIJA' | RolGrupoFamiliar;
  fechaNacimiento?: string;
  edad?: number;
}

export interface AsistenciaItem {
  socioId: string;
  socioNombre: string;
  presente: boolean;
}

export interface AsistenciaRegistro {
  id: string;
  actividadId: string;
  fecha: string;
  instructorId: string;
  asistencias: AsistenciaItem[];
}

export type Socio = socios & {
  numeroSocio?: number;
  nombreCompleto?: string;
  fechaIngreso?: string;
  edad?: number;
  antiguedadAnios?: number;
  cuotasAdeudadas?: number;
  esTitularFamilia?: boolean;
  familiares?: Familiar[];
  actividadesIds?: (string | number)[];
  casilleroAsignadoId?: number;
  fotoUrl?: string;
};

export type Locker = casilleros & {
  estado?: 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO';
  socioNombre?: string;
  socioDni?: string;
  socioId?: string;
  fechaAsignacion?: string;
};

export type Actividad = actividades & {
  categoria?: string;
  dias?: string[];
  horario?: string;
  cupoOcupado?: number;
  costoMensual?: number;
  lugar?: string;
  edadMinima?: number;
};

export type Cobrador = cobradores & {
  nombreCompleto?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  zonaAsignada?: number;
  porcentajeComision?: number;
  activo?: boolean;
  fechaAlta?: string;
  observaciones?: string;
};

export type Instructor = instructores & {
  nombreCompleto?: string;
  dni?: string;
  tituloProfesional?: string;
  disciplinasIds?: string[];
  modalidadContrato?: string;
  remuneracionMensual?: number;
  diasDisponibles?: string[];
  activo?: boolean;
  fechaAlta?: string;
  observaciones?: string;
};

export type CuponRecibo = cupones & {
  numeroComprobante?: string;
  socioNombre?: string;
  socioDni?: string;
  zonaCobro?: number;
  periodoMes?: string;
  fechaVencimiento?: string;
  cuotaSocialBase?: number;
  detalleActividades?: { nombre: string; monto: number }[];
  costoCasillero?: number;
  recargoMoraPorcentaje?: number;
  montoRecargoMora?: number;
  descuentoFamiliar?: number;
  subtotal?: number;
  totalPagar?: number;
  estadoPago?: string;
  metodoPago?: string;
};

export type RendicionLiquidacion = rendiciones & {
  cobradorNombre?: string;
  zonaCobro?: number;
  semanaNumero?: number;
  periodoFecha?: string;
  recibosCobradosIds?: string[];
  totalCobrado?: number;
  porcentajeComision?: number;
  montoComisionCobrador?: number;
  netoRendidoClub?: number;
  estado?: string;
};

export type AppUser = users & {
  nombreCompleto?: string;
  zonaAsignada?: number;
  actividadId?: string;
};
import { useApi } from '../hooks/useApi';

export type ActiveTab =
  | 'inicio'
  | 'dashboard'
  | 'socios'
  | 'cobradores'
  | 'instructores'
  | 'casilleros'
  | 'actividades'
  | 'asistencia'
  | 'cobranza'
  | 'rendicion'
  | 'morosidad'
  | 'portal_socio'
  | 'plan_doc';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface AppContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toast: ToastMessage | null;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => void;
  closeToast: () => void;

  // API & Database status
  isApiConnected: boolean;
  isSyncing: boolean;
  syncWithDatabase: () => Promise<void>;
  
  // Usuarios de BD
  usersList: AppUser[];

  // Socios
  socios: Socio[];
  addSocio: (data: any) => Promise<boolean>;
  updateSocio: (id: string | number, data: Partial<Socio>) => Promise<void>;
  deleteSocio: (id: string | number) => Promise<void>;
  addFamiliar: (socioId: string | number, familiar: any) => Promise<void>;
  removeFamiliar: (socioId: string | number, familiarId: string | number) => Promise<void>;
  regularizarDeudaSocio: (socioId: string | number) => Promise<void>;

  // Cobradores CRUD
  cobradores: Cobrador[];
  addCobrador: (data: any) => Promise<boolean>;
  updateCobrador: (id: string | number, data: Partial<Cobrador>) => Promise<void>;
  deleteCobrador: (id: string | number) => Promise<void>;
  toggleCobradorEstado: (id: string | number) => Promise<void>;

  // Instructores CRUD
  instructores: Instructor[];
  addInstructor: (data: any) => Promise<boolean>;
  updateInstructor: (id: string | number, data: Partial<Instructor>) => Promise<void>;
  deleteInstructor: (id: string | number) => Promise<void>;
  toggleInstructorEstado: (id: string | number) => Promise<void>;

  // Casilleros
  lockers: Locker[];
  assignLocker: (lockerNumber: number, socioId: string | number) => Promise<boolean>;
  releaseLocker: (lockerNumber: number) => Promise<void>;
  reserveLocker: (lockerNumber: number) => Promise<void>;

  // Actividades
  actividades: Actividad[];
  enrollSocioInActividad: (socioId: string | number, actividadId: string | number) => Promise<boolean>;
  unenrollSocioFromActividad: (socioId: string | number, actividadId: string | number) => Promise<void>;

  // Asistencias
  asistencias: AsistenciaRegistro[];
  saveAsistencia: (registro: AsistenciaRegistro) => Promise<void>;

  // Cupones y Cobranza
  cupones: CuponRecibo[];
  generarCuponMesActual: (socioId: string | number) => Promise<void>;
  marcarCuponPagado: (cuponId: string | number, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string) => Promise<void>;
  reemitirCuponConMora: (cuponId: string | number) => Promise<void>;

  // Rendiciones
  rendiciones: RendicionLiquidacion[];
  crearRendicionSemanal: (zonaCobro: number, cobradorId: string | number, cobradorNombre: string, cuponesIds: (string | number)[]) => Promise<void>;
  aprobarRendicion: (rendicionId: string | number) => Promise<void>;

  // Helpers
  calcularCategoria: (fechaNacimiento: string, fechaIngreso: string) => { categoria: SocioCategoria; edad: number; antiguedadAnios: number };
  quickSwitchUser: (userId: string | number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Instancias del hook useApi
  const usersApi = useApi('/users');
  const sociosApi = useApi('/socios');
  const cobradoresApi = useApi('/cobradores');
  const instructoresApi = useApi('/instructores');
  const casillerosApi = useApi('/casilleros');
  const actividadesApi = useApi('/actividades');
  const cuponesApi = useApi('/cupones');
  const rendicionesApi = useApi('/rendiciones');
  const asistenciasApi = useApi('/asistencias');

  const GUEST_USER: AppUser = {
    id: 0,
    email: 'invitado@elglobo.com',
    password: '',
    role: 'PUBLICO',
    nombreCompleto: 'Invitado Público',
    activo: true,
  };

  // Usuario activo en sesión
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('el_globo_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return GUEST_USER;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Estados de conexión
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Estados de datos (solamente poblados desde la base de datos)
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cupones, setCupones] = useState<CuponRecibo[]>([]);
  const [rendiciones, setRendiciones] = useState<RendicionLiquidacion[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    setToast({
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      description,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Carga paralela de datos de BD mediante la API de NestJS
  const syncWithDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [
        usersData,
        sociosData,
        cobradoresData,
        instructoresData,
        casillerosData,
        actividadesData,
        cuponesData,
        rendicionesData,
        asistenciasData,
      ] = await Promise.all([
        usersApi.get().catch(() => []),
        sociosApi.get().catch(() => []),
        cobradoresApi.get().catch(() => []),
        instructoresApi.get().catch(() => []),
        casillerosApi.get().catch(() => []),
        actividadesApi.get().catch(() => []),
        cuponesApi.get().catch(() => []),
        rendicionesApi.get().catch(() => []),
        asistenciasApi.get().catch(() => []),
      ]);

      if (Array.isArray(usersData)) {
        setUsersList(usersData);
        // Si no hay usuario en localStorage, se establece el primero traído desde la BD
        if (!currentUser && usersData.length > 0) {
          setCurrentUser(usersData[0]);
        }
      }
      if (Array.isArray(sociosData)) setSocios(sociosData);
      if (Array.isArray(cobradoresData)) setCobradores(cobradoresData);
      if (Array.isArray(instructoresData)) setInstructores(instructoresData);
      if (Array.isArray(casillerosData)) setLockers(casillerosData);
      if (Array.isArray(actividadesData)) setActividades(actividadesData);
      if (Array.isArray(cuponesData)) setCupones(cuponesData);
      if (Array.isArray(rendicionesData)) setRendiciones(rendicionesData);
      if (Array.isArray(asistenciasData)) setAsistencias(asistenciasData);

      setIsApiConnected(true);
    } catch (err: any) {
      console.error('[AppContext] Error conectando con la BD:', err);
      setIsApiConnected(false);
      showToast('error', 'Error de BD', 'No se pudo conectar a la base de datos.');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('el_globo_current_user');
    }
  }, [currentUser]);

  // Reglas de negocio para Socios
  const calcularCategoria = (fechaNacimiento: string, fechaIngreso: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    if (isNaN(edad) || edad < 0) edad = 0;

    const ing = new Date(fechaIngreso);
    let antiguedad = hoy.getFullYear() - ing.getFullYear();
    const mIng = hoy.getMonth() - ing.getMonth();
    if (mIng < 0 || (mIng === 0 && hoy.getDate() < ing.getDate())) antiguedad--;
    if (isNaN(antiguedad) || antiguedad < 0) antiguedad = 0;

    let categoria: SocioCategoria = 'ACTIVO';
    if (edad < 18) {
      categoria = 'CADETE';
    } else if (antiguedad >= 30) {
      categoria = 'VITALICIO';
    }

    return { categoria, edad, antiguedadAnios: antiguedad };
  };

  // SOCIOS CRUD BD
  const addSocio = async (data: any): Promise<boolean> => {
    if (socios.some((s) => s.dni.trim() === String(data.dni).trim())) {
      showToast('error', 'Error al registrar', `Ya existe un socio registrado con el DNI ${data.dni}.`);
      return false;
    }

    const fechaAltaNorm = data.fechaAlta || data.fechaIngreso || new Date().toISOString().split('T')[0];
    const { categoria, edad, antiguedadAnios } = calcularCategoria(data.fechaNacimiento, fechaAltaNorm);
    const payload = {
      ...data,
      fechaAlta: fechaAltaNorm,
      edad,
      antiguedadAnios,
      categoria,
      estado: data.estado || 'ACTIVO',
      mesesImpagosConsecutivos: data.mesesImpagosConsecutivos || 0,
    };

    try {
      const nuevoSocio = await sociosApi.create(payload);
      setSocios((prev) => [nuevoSocio, ...prev]);
      showToast('success', 'Socio registrado', `${nuevoSocio.nombre || nuevoSocio.nombreCompleto} guardado en BD.`);
      return true;
    } catch (err: any) {
      showToast('error', 'Error en BD', err.message);
      return false;
    }
  };

  const updateSocio = async (id: string, data: Partial<Socio>) => {
    try {
      const actualizado = await sociosApi.update(id, data);
      setSocios((prev) => prev.map((s) => (String(s.id) === String(id) ? actualizado : s)));
      showToast('success', 'Padrón actualizado', 'Datos actualizados en BD.');
    } catch (err: any) {
      showToast('error', 'Error al actualizar', err.message);
    }
  };

  const deleteSocio = async (id: string) => {
    try {
      await sociosApi.remove(id);
      setSocios((prev) => prev.filter((s) => String(s.id) !== String(id)));
      showToast('info', 'Socio eliminado', 'Registro eliminado de la BD.');
    } catch (err: any) {
      showToast('error', 'Error al eliminar', err.message);
    }
  };

  const addFamiliar = async (socioId: string, familiarData: Omit<Familiar, 'id' | 'edad'>) => {
    try {
      const familiarCreado = await useApi(`/socios/${socioId}/familiares`).create(familiarData);
      setSocios((prev) =>
        prev.map((s) => (String(s.id) === String(socioId) ? { ...s, familiares: [...(s.familiares || []), familiarCreado] } : s))
      );
      showToast('success', 'Familiar registrado', `${familiarData.nombre} vinculado en BD.`);
    } catch (err: any) {
      showToast('error', 'Error al agregar familiar', err.message);
    }
  };

  const removeFamiliar = async (socioId: string, familiarId: string) => {
    try {
      await useApi(`/socios/${socioId}/familiares`).remove(familiarId);
      setSocios((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(socioId)) return s;
          return { ...s, familiares: (s.familiares || []).filter((f: any) => String(f.id) !== String(familiarId)) };
        })
      );
      showToast('info', 'Familiar desvinculado');
    } catch (err: any) {
      showToast('error', 'Error al desvincular familiar', err.message);
    }
  };

  const regularizarDeudaSocio = async (socioId: string) => {
    try {
      await useApi(`/socios/${socioId}/regularizar`).create({});
      await syncWithDatabase();
      showToast('success', 'Deuda regularizada', 'Socio habilitado en BD.');
    } catch (err: any) {
      showToast('error', 'Error al regularizar', err.message);
    }
  };

  // COBRADORES CRUD BD
  const addCobrador = async (data: Omit<Cobrador, 'id' | 'fechaAlta'>): Promise<boolean> => {
    try {
      const nuevo = await cobradoresApi.create(data);
      setCobradores((prev) => [nuevo, ...prev]);
      showToast('success', 'Cobrador guardado', `Cobrador de Zona ${nuevo.zona} guardado en BD.`);
      return true;
    } catch (err: any) {
      showToast('error', 'Error en BD', err.message);
      return false;
    }
  };

  const updateCobrador = async (id: string, data: Partial<Cobrador>) => {
    try {
      const actualizado = await cobradoresApi.update(id, data);
      setCobradores((prev) => prev.map((c) => (String(c.id) === String(id) ? actualizado : c)));
      showToast('success', 'Cobrador actualizado');
    } catch (err: any) {
      showToast('error', 'Error al actualizar', err.message);
    }
  };

  const deleteCobrador = async (id: string) => {
    try {
      await cobradoresApi.remove(id);
      setCobradores((prev) => prev.filter((c) => String(c.id) !== String(id)));
      showToast('info', 'Cobrador eliminado');
    } catch (err: any) {
      showToast('error', 'Error al eliminar', err.message);
    }
  };

  const toggleCobradorEstado = async (id: string) => {
    const target = cobradores.find((c) => String(c.id) === String(id));
    if (!target) return;
    try {
      const nuevoEstado = !target.activo;
      await cobradoresApi.update(id, { activo: nuevoEstado });
      setCobradores((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, activo: nuevoEstado } : c)));
      showToast('info', 'Estado actualizado');
    } catch (err: any) {
      showToast('error', 'Error al actualizar estado', err.message);
    }
  };

  // INSTRUCTORES CRUD BD
  const addInstructor = async (data: Omit<Instructor, 'id' | 'fechaAlta'>): Promise<boolean> => {
    try {
      const nuevo = await instructoresApi.create(data);
      setInstructores((prev) => [nuevo, ...prev]);
      showToast('success', 'Instructor guardado');
      return true;
    } catch (err: any) {
      showToast('error', 'Error al registrar instructor', err.message);
      return false;
    }
  };

  const updateInstructor = async (id: string, data: Partial<Instructor>) => {
    try {
      const actualizado = await instructoresApi.update(id, data);
      setInstructores((prev) => prev.map((i) => (String(i.id) === String(id) ? actualizado : i)));
      showToast('success', 'Instructor actualizado');
    } catch (err: any) {
      showToast('error', 'Error al actualizar instructor', err.message);
    }
  };

  const deleteInstructor = async (id: string) => {
    try {
      await instructoresApi.remove(id);
      setInstructores((prev) => prev.filter((i) => String(i.id) !== String(id)));
      showToast('info', 'Instructor eliminado');
    } catch (err: any) {
      showToast('error', 'Error al eliminar instructor', err.message);
    }
  };

  const toggleInstructorEstado = async (id: string) => {
    const target = instructores.find((i) => String(i.id) === String(id));
    if (!target) return;
    try {
      const nuevoEstado = !target.activo;
      await instructoresApi.update(id, { activo: nuevoEstado });
      setInstructores((prev) => prev.map((i) => (String(i.id) === String(id) ? { ...i, activo: nuevoEstado } : i)));
      showToast('info', 'Estado actualizado');
    } catch (err: any) {
      showToast('error', 'Error al actualizar estado', err.message);
    }
  };

  // CASILLEROS BD
  const assignLocker = async (lockerNumber: number, socioId: string): Promise<boolean> => {
    try {
      const casilleroActualizado = await useApi(`/casilleros/${lockerNumber}/asignar`).create({ socioId });
      setLockers((prev) => prev.map((l) => (l.numero === lockerNumber ? casilleroActualizado : l)));
      showToast('success', 'Casillero asignado');
      return true;
    } catch (err: any) {
      showToast('error', 'Error al asignar casillero', err.message);
      return false;
    }
  };

  const releaseLocker = async (lockerNumber: number) => {
    try {
      const casilleroLiberado = await useApi(`/casilleros/${lockerNumber}/liberar`).create({});
      setLockers((prev) => prev.map((l) => (l.numero === lockerNumber ? casilleroLiberado : l)));
      showToast('info', 'Casillero liberado');
    } catch (err: any) {
      showToast('error', 'Error al liberar casillero', err.message);
    }
  };

  const reserveLocker = async (lockerNumber: number) => {
    try {
      const res = await casillerosApi.update(lockerNumber, { reservado: true });
      setLockers((prev) => prev.map((l) => (l.numero === lockerNumber ? res : l)));
      showToast('info', 'Casillero reservado');
    } catch (err: any) {
      showToast('error', 'Error al reservar casillero', err.message);
    }
  };

  // ACTIVIDADES Y INSCRIPCIONES BD
  const enrollSocioInActividad = async (socioId: string, actividadId: string): Promise<boolean> => {
    try {
      await useApi('/inscripciones').create({ socioId, actividadId });
      await syncWithDatabase();
      showToast('success', 'Inscripción confirmada');
      return true;
    } catch (err: any) {
      showToast('error', 'Error en inscripción', err.message);
      return false;
    }
  };

  const unenrollSocioFromActividad = async (socioId: string, actividadId: string) => {
    try {
      await useApi(`/inscripciones/socio/${socioId}/actividad/${actividadId}`).remove('');
      await syncWithDatabase();
      showToast('info', 'Inscripción cancelada');
    } catch (err: any) {
      showToast('error', 'Error al cancelar inscripción', err.message);
    }
  };

  // ASISTENCIAS BD
  const saveAsistencia = async (registro: AsistenciaRegistro) => {
    try {
      const guardada = await asistenciasApi.create(registro);
      setAsistencias((prev) => [guardada, ...prev.filter((a) => a.id !== guardada.id)]);
      showToast('success', 'Asistencia guardada');
    } catch (err: any) {
      showToast('error', 'Error al registrar asistencia', err.message);
    }
  };

  // CUPONES Y COBRANZAS BD
  const generarCuponMesActual = async (socioId: string) => {
    try {
      const cuponNuevo = await useApi(`/cupones/generar/${socioId}`).create({});
      setCupones((prev) => [cuponNuevo, ...prev]);
      showToast('success', 'Recibo generado en BD');
    } catch (err: any) {
      showToast('error', 'Error al generar recibo', err.message);
    }
  };

  const marcarCuponPagado = async (cuponId: string, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string) => {
    try {
      const cuponPagado = await cuponesApi.update(cuponId, {
        estado: 'PAGADO',
        metodoPago,
        cobradorId,
        fechaPago: new Date().toISOString(),
      });
      setCupones((prev) => prev.map((c) => (String(c.id) === String(cuponId) ? cuponPagado : c)));
      showToast('success', 'Pago registrado en BD');
    } catch (err: any) {
      showToast('error', 'Error al asentar pago', err.message);
    }
  };

  const reemitirCuponConMora = async (cuponId: string) => {
    try {
      const cuponActualizado = await useApi(`/cupones/${cuponId}/mora`).create({});
      setCupones((prev) => prev.map((c) => (String(c.id) === String(cuponId) ? cuponActualizado : c)));
      showToast('warning', 'Mora aplicada en BD');
    } catch (err: any) {
      showToast('error', 'Error al aplicar mora', err.message);
    }
  };

  // RENDICIONES BD
  const crearRendicionSemanal = async (zonaCobro: number, cobradorId: string, cobradorNombre: string, cuponesIds: string[]) => {
    try {
      const rendicion = await rendicionesApi.create({
        zonaCobro,
        cobradorId,
        cobradorNombre,
        cuponesIds,
      });
      setRendiciones((prev) => [rendicion, ...prev]);
      showToast('success', 'Rendición creada');
    } catch (err: any) {
      showToast('error', 'Error al generar rendición', err.message);
    }
  };

  const aprobarRendicion = async (rendicionId: string) => {
    try {
      const aprobada = await rendicionesApi.update(rendicionId, { estado: 'APROBADA' });
      setRendiciones((prev) => prev.map((r) => (String(r.id) === String(rendicionId) ? aprobada : r)));
      showToast('success', 'Rendición Aprobada');
    } catch (err: any) {
      showToast('error', 'Error al aprobar rendición', err.message);
    }
  };

  // Cambio de usuario exclusivamente desde el listado obtenido de la BD
  const quickSwitchUser = (userId: string) => {
    const foundUser = usersList.find((u) => String(u.id) === String(userId));
    if (foundUser) {
      setCurrentUser(foundUser);
      if (foundUser.role === 'ADMIN') setActiveTab('dashboard');
      else if (foundUser.role === 'COBRADOR') setActiveTab('cobranza');
      else if (foundUser.role === 'INSTRUCTOR') setActiveTab('asistencia');
      else if (foundUser.role === 'SOCIO') setActiveTab('portal_socio');
      else setActiveTab('inicio');

      showToast('info', 'Sesión cambiada', `Usuario activo: ${foundUser.nombreCompleto || foundUser.email}`);
    } else {
      showToast('error', 'Usuario no encontrado', 'El usuario solicitado no existe en la base de datos.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        closeToast,
        isApiConnected,
        isSyncing,
        syncWithDatabase,
        usersList,
        socios,
        addSocio,
        updateSocio,
        deleteSocio,
        addFamiliar,
        removeFamiliar,
        regularizarDeudaSocio,
        cobradores,
        addCobrador,
        updateCobrador,
        deleteCobrador,
        toggleCobradorEstado,
        instructores,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        toggleInstructorEstado,
        lockers,
        assignLocker,
        releaseLocker,
        reserveLocker,
        actividades,
        enrollSocioInActividad,
        unenrollSocioFromActividad,
        asistencias,
        saveAsistencia,
        cupones,
        generarCuponMesActual,
        marcarCuponPagado,
        reemitirCuponConMora,
        rendiciones,
        crearRendicionSemanal,
        aprobarRendicion,
        calcularCategoria,
        quickSwitchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};