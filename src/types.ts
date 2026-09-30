export type UserRole = 'ADMIN' | 'COBRADOR' | 'INSTRUCTOR' | 'SOCIO' | 'PUBLICO';

export type SocioCategoria = 'CADETE' | 'ACTIVO' | 'VITALICIO';

export type SocioEstado = 'AL_DIA' | 'DEUDOR_1_MES' | 'SUSPENDIDO_MOROSIDAD';

export type LockerEstado = 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO';

export interface Familiar {
  id: string;
  nombreCompleto: string;
  dni: string;
  parentesco: 'CONYUGE' | 'HIJO' | 'HIJA';
  fechaNacimiento: string;
  edad: number;
}

export interface Socio {
  id: string;
  numeroSocio: number;
  nombreCompleto: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  zonaCobro: number; // 0: Sede, 1: Centro/Norte, 2: Sur/Estación, 3: Este/Costanera
  fechaNacimiento: string;
  fechaIngreso: string; // Para calcular antigüedad
  edad: number;
  antiguedadAnios: number;
  categoria: SocioCategoria;
  estado: SocioEstado;
  cuotasAdeudadas: number;
  esTitularFamilia: boolean;
  familiares: Familiar[];
  actividadesIds: string[];
  casilleroAsignadoId?: number; // 1 a 100
  fotoUrl?: string;
}

export interface Locker {
  numero: number; // 1 a 100
  estado: LockerEstado;
  socioId?: string;
  socioNombre?: string;
  socioDni?: string;
  fechaAsignacion?: string;
  costoMensual: number; // Ej: $3.500
}

export interface Actividad {
  id: string;
  nombre: string;
  categoria: string;
  dias: string[];
  horario: string;
  instructorId: string;
  instructorNombre: string;
  cupoMaximo: number;
  cupoOcupado: number;
  costoMensual: number; // Ej: $7.500
  lugar: string;
  edadMinima: number;
  descripcion: string;
}

export interface AsistenciaRegistro {
  id: string;
  actividadId: string;
  fecha: string;
  instructorId: string;
  asistencias: {
    socioId: string;
    socioNombre: string;
    presente: boolean;
  }[];
}

export interface CuponRecibo {
  id: string;
  numeroComprobante: string;
  socioId: string;
  socioNombre: string;
  socioDni: string;
  zonaCobro: number;
  periodoMes: string; // ej: "Septiembre 2026"
  fechaEmision: string;
  fechaVencimiento: string;
  cuotaSocialBase: number;
  detalleActividades: {
    nombre: string;
    monto: number;
  }[];
  costoCasillero: number;
  recargoMoraPorcentaje: number; // 5% si tiene mora
  montoRecargoMora: number;
  descuentoFamiliar: number;
  subtotal: number;
  totalPagar: number;
  estadoPago: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  fechaPago?: string;
  cobradorId?: string;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL';
}

export interface RendicionLiquidacion {
  id: string;
  cobradorId: string;
  cobradorNombre: string;
  zonaCobro: number;
  semanaNumero: number;
  periodoFecha: string;
  recibosCobradosIds: string[];
  totalCobrado: number;
  porcentajeComision: number; // 10%
  montoComisionCobrador: number;
  netoRendidoClub: number;
  estado: 'PENDIENTE_SECRETARIA' | 'APROBADA';
  fechaRendicion: string;
}

export interface AppUser {
  id: string;
  username: string;
  nombreCompleto: string;
  email: string;
  role: UserRole;
  zonaAsignada?: number; // Para cobradores
  actividadId?: string; // Para instructores
  socioId?: string; // Para socios
}
