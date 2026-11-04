export type UserRole = 'ADMIN' | 'COBRADOR' | 'INSTRUCTOR' | 'SOCIO' | 'PUBLICO';

export type SocioCategoria = 'CADETE' | 'ACTIVO' | 'VITALICIO';

export type SocioEstado = 'ACTIVO' | 'MOROSO' | 'SUSPENDIDO' | 'BAJA';

export type TurnoActividad = 'MATUTINO' | 'VESPERTINO' | 'NOCTURNO';

export type RolGrupoFamiliar = 'TITULAR' | 'CONYUGE' | 'HIJO';

export type EstadoCupon = 'PENDIENTE' | 'PAGADO' | 'DEVUELTO' | 'ANULADO';

export interface configuracion{
  id: number;
  cuotaCadete: number;
  cuotaActivo: number;
  cuotaVitalicio: number;
  cuotaGrupoFamiliar: number;
  costoCasillero: number;
  recargoMorosidad: number;
  comisionCobrador: number;
  edadMinimaActivo: number;
  edadMinimaVitalicio: number;
  antiguedadMinimaVitalicio: number;
  mesesConsecutivosParaMorosidad: number;
  totalCasilleros: number;
  totalActividades: number;
  updatedAt: string;
}

export interface grupos_familiares {
  id: number;
  cuotaGrupal: number;
  createdAt?: string;
}

export interface Familiar {
  id: number | string;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  dni: string;
  parentesco: 'CONYUGE' | 'HIJO' | 'HIJA';
  fechaNacimiento: string;
  edad?: number;
}

export interface socios {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  fechaAlta: string;
  direccion?: string;
  localidad?: string;
  telefono?: string;
  email: string;
  categoria: SocioCategoria;
  zonaCobro: number; // 0: Club, 1: Zona 1, 2: Zona 2, 3: Zona 3
  estado: SocioEstado;
  mesesImpagosConsecutivos: number;
  grupoFamiliarId?: number | null;
  rolGrupoFamiliar?: RolGrupoFamiliar | null;
  createdAt: string;
  updatedAt: string;
}

export interface casilleros {
  id: number;
  numero: number; // 1 a 100
  costoMensual: number; // 2500.00
  fechaAlquiler?: string | null;
}

export interface instructores {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  sueldo?: number;
  createdAt?: string;
}

export interface cobradores {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  zona: number; // 1=Perez, 2=Garcia, 3=Rodriguez
  comisionPorcentaje: number; // 10.00
  createdAt?: string;
}

export interface actividades {
  id: number;
  nombre: string;
  descripcion?: string;
  arancel: number;
  turno: TurnoActividad;
  diasSemana?: string;
  horaInicio?: string;
  horaFin?: string;
  cupoMaximo?: number;
  instructorId?: number | null;
  instructorNombre?: string;
  activa: boolean;
  createdAt?: string;
}

export interface inscripciones {
  id: number;
  socioId: number;
  actividadId: number;
  activa: boolean;
  fechaInscripcion?: string;
}

export interface cupones {
  id: number;
  socioId: number;
  grupoFamiliarId?: number | null;
  periodo: string; // Formato YYYY-MM
  zona: number;
  cobradorId?: number | null;
  montoCuotaSocial: number;
  montoActividades: number;
  montoCasillero: number;
  recargoPorcentaje: number;
  montoTotal: number;
  estado: EstadoCupon;
  esReemision: boolean;
  detalle?: string;
  fechaPago?: string | null;
  fechaEmision?: string;
}

export interface rendiciones {
  id: number;
  cobradorId: number;
  semanaInicio: string;
  semanaFin: string;
  montoRecaudado: number;
  comisionCalculada: number;
  montoNeto: number;
  esUltimaSemanaDelMes: boolean;
  fechaRendicion?: string;
}

export interface rendicion_detalles {
  id: number;
  rendicionId: number;
  cuponId: number;
  importeCobrado: number;
  cobrado: boolean;
}

export interface users {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  activo?: boolean;
  socioId?: number | null;
  instructorId?: number | null;
  cobradorId?: number | null;
  createdAt?: string;
}