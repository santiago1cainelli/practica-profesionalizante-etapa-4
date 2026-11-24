export type UserRole = 'ADMIN' | 'COBRADOR' | 'INSTRUCTOR' | 'SOCIO' | 'PUBLICO';

export type SocioCategoria = 'CADETE' | 'ACTIVO' | 'VITALICIO';

export type SocioEstado =
  | 'ACTIVO'
  | 'MOROSO'
  | 'SUSPENDIDO'
  | 'BAJA'
  | 'AL_DIA'
  | 'DEUDOR_1_MES'
  | 'SUSPENDIDO_MOROSIDAD'
  | 'EXENTO_VITALICIO';

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

// Aliases y tipos enriquecidos para compatibilidad con vistas y backend
export type Socio = Omit<Partial<socios>, 'id' | 'cobradorId' | 'instructorId'> & {
  id?: string | number;
  numeroSocio?: number;
  nombreCompleto?: string;
  fechaIngreso?: string;
  edad?: number;
  antiguedadAnios?: number;
  cuotasAdeudadas?: number;
  esTitularFamilia?: boolean;
  actividadesIds?: any[];
  casilleroAsignadoId?: any;
  fotoUrl?: string;
  familiares?: any[];
  estado?: SocioEstado;
  categoria?: any;
  [key: string]: any;
};

export type Locker = Omit<Partial<casilleros>, 'id' | 'socioId'> & {
  id?: string | number;
  numero?: number;
  estado?: 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO';
  socioNombre?: string;
  socioDni?: string;
  socioId?: any;
  fechaAsignacion?: string;
  costoMensual?: number;
  [key: string]: any;
};

export type Actividad = Omit<Partial<actividades>, 'id' | 'instructorId'> & {
  id?: string | number;
  nombre?: string;
  categoria?: string;
  dias?: string[];
  horario?: string;
  cupoOcupado?: number;
  costoMensual?: number;
  lugar?: string;
  edadMinima?: number;
  instructorId?: any;
  instructorNombre?: string;
  [key: string]: any;
};

export type Cobrador = Omit<Partial<cobradores>, 'id'> & {
  id?: string | number;
  nombreCompleto?: string;
  zonaAsignada?: number;
  porcentajeComision?: number;
  activo?: boolean;
  [key: string]: any;
};

export type Instructor = Omit<Partial<instructores>, 'id'> & {
  id?: string | number;
  nombreCompleto?: string;
  tituloProfesional?: string;
  disciplinasIds?: string[];
  activo?: boolean;
  [key: string]: any;
};

export type CuponRecibo = Omit<Partial<cupones>, 'id' | 'cobradorId' | 'socioId'> & {
  id?: string | number;
  socioId?: any;
  cobradorId?: any;
  numeroComprobante?: string;
  socioNombre?: string;
  socioDni?: string;
  periodoMes?: string;
  fechaVencimiento?: string;
  cuotaSocialBase?: number;
  estadoPago?: string;
  totalPagar?: number;
  [key: string]: any;
};

export type RendicionLiquidacion = Omit<Partial<rendiciones>, 'id' | 'cobradorId'> & {
  id?: string | number;
  cobradorId?: any;
  cobradorNombre?: string;
  zonaCobro?: number;
  totalCobrado?: number;
  netoRendidoClub?: number;
  estado?: string;
  [key: string]: any;
};

export type AppUser = Omit<Partial<users>, 'id' | 'socioId' | 'instructorId' | 'cobradorId' | 'password'> & {
  id?: string | number;
  email: string;
  password?: string;
  role: UserRole;
  nombreCompleto?: string;
  zonaAsignada?: number;
  actividadId?: any;
  socioId?: any;
  instructorId?: any;
  cobradorId?: any;
  username?: string;
  [key: string]: any;
};

export type Familiar = any;
export type AsistenciaRegistro = any;
