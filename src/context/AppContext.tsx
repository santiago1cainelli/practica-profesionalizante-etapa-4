import { createContext } from 'react';
import {
  socios,
  casilleros,
  actividades,
  cobradores,
  instructores,
  cupones,
  rendiciones,
  users,
} from '../types';

export type Socio = socios & {
  numeroSocio?: number;
  nombreCompleto?: string;
  fechaIngreso?: string;
  edad?: number;
  antiguedadAnios?: number;
  cuotasAdeudadas?: number;
  esTitularFamilia?: boolean;
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
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  sueldo?: number;
  createdAt?: number;
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

export type AppUser = Omit<users, 'password'> & {
  password?: string;
  nombreCompleto?: string;
  zonaAsignada?: number;
  actividadId?: string;
  socioId?: string | number | null; // ✅ Agregado para vincular usuario con socio
  instructorId?: string | number | null;
  cobradorId?: string | number | null;
};

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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export interface AppContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: (prefillEmail?: string) => void;
  closeLoginModal: () => void;
  loginModalEmail?: string;
  refrescarDatos: () => Promise<void>;
  quickSwitchUser: (userIdOrRole: string) => void; // ✅ Agregado
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toast: ToastMessage | null;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => void;
  closeToast: () => void;
  isLoading: boolean;

  // Usuarios
  usersList: AppUser[];

  // Socios CRUD
  socios: Socio[];
  agregarSocio: (socio: any) => Promise<void>;
  actualizarSocio: (socio: Socio) => Promise<void>;
  eliminarSocio: (id: string | number) => Promise<void>;

  // Cobradores CRUD
  cobradores: Cobrador[];
  agregarCobrador: (cobrador: any) => Promise<void>;
  actualizarCobrador: (cobrador: Cobrador) => Promise<void>;
  eliminarCobrador: (id: string | number) => Promise<void>;

  // Instructores CRUD
  instructores: Instructor[];
  agregarInstructor: (instructor: any) => Promise<void>;
  actualizarInstructor: (instructor: Instructor) => Promise<void>;
  eliminarInstructor: (id: string | number) => Promise<void>;

  // Casilleros CRUD
  lockers: Locker[];
  actualizarCasillero: (casillero: Locker) => Promise<void>;

  // Actividades CRUD e Inscripciones
  actividades: Actividad[];
  agregarActividad: (actividad: any) => Promise<void>;
  actualizarActividad: (actividad: Actividad) => Promise<void>;
  eliminarActividad: (id: string | number) => Promise<void>;
  enrollSocioInActividad: (socioId: string, actividadId: string) => Promise<boolean>; // ✅ Agregado
  unenrollSocioFromActividad: (socioId: string, actividadId: string) => Promise<boolean>; // ✅ Agregado

  // Cupones y Rendiciones
  cupones: CuponRecibo[];
  rendiciones: RendicionLiquidacion[];
}

// ✅ Inicializado en undefined (no en {})
export const AppContext = createContext<AppContextType | undefined>(undefined);