import {
  Socio,
  Locker,
  Actividad,
  CuponRecibo,
  RendicionLiquidacion,
  AppUser,
  Cobrador,
  Instructor,
} from '../types';

export const CUOTA_VALORES = {
  CADETE: 8000,
  ACTIVO: 14000,
  VITALICIO: 0, // Exento por estatuto (opción voluntaria $2.500)
  CASILLERO_MENSUAL: 3500,
  RECARGO_MORA_PORCENTAJE: 0.05, // 5%
  COMISION_COBRADOR_PORCENTAJE: 0.10, // 10%
  DESCUENTO_FAMILIAR_POR_HIJO: 1500,
};

export const ZONAS_NOMBRES: Record<number, { nombre: string; descripcion: string; cobradorDefault: string }> = {
  0: {
    nombre: 'Zona 0 - Sede Central',
    descripcion: 'Cobro directo por ventanilla en Secretaría del Club',
    cobradorDefault: 'Secretaría de Cobranzas',
  },
  1: {
    nombre: 'Zona 1 - Centro & Barrio Norte',
    descripcion: 'Radio delimitado por Av. San Martín y Costanera Norte',
    cobradorDefault: 'Sin asignar',
  },
  2: {
    nombre: 'Zona 2 - Sur & Estación',
    descripcion: 'Sector Ferrocarril, Av. Pellegrini y Bulevares Sur',
    cobradorDefault: 'Sin asignar',
  },
  3: {
    nombre: 'Zona 3 - Este & Costanera',
    descripcion: 'Ribera del Río, Parque Municipal y B° Obrero',
    cobradorDefault: 'Sin asignar',
  },
};

export const MOCK_USERS: AppUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    nombreCompleto: 'Administrador General',
    email: 'administracion@clubelglobo.com.ar',
    role: 'ADMIN',
  },
  {
    id: 'user-cobrador-1',
    username: 'cobrador',
    nombreCompleto: 'Cobrador Zona 1',
    email: 'cobranzas.zona1@clubelglobo.com.ar',
    role: 'COBRADOR',
    zonaAsignada: 1,
  },
  {
    id: 'user-instructor',
    username: 'instructor',
    nombreCompleto: 'Instructor Deportes',
    email: 'deportes@clubelglobo.com.ar',
    role: 'INSTRUCTOR',
  },
  {
    id: 'user-invitado',
    username: 'invitado',
    nombreCompleto: 'Visitante Invitado (No logueado)',
    email: 'visitante@clubelglobo.com.ar',
    role: 'PUBLICO',
  },
];

export const INITIAL_ACTIVIDADES: Actividad[] = [];

export const INITIAL_SOCIOS: Socio[] = [];

// Generar 100 casilleros disponibles
export const generateInitialLockers = (socios: Socio[] = []): Locker[] => {
  const lockers: Locker[] = [];
  const assignedMap = new Map<number, Socio>();

  socios.forEach((s) => {
    if (s.casilleroAsignadoId) {
      assignedMap.set(s.casilleroAsignadoId, s);
    }
  });

  for (let i = 1; i <= 100; i++) {
    const assignedSocio = assignedMap.get(i);

    if (assignedSocio) {
      lockers.push({
        numero: i,
        estado: 'OCUPADO',
        socioId: assignedSocio.id,
        socioNombre: assignedSocio.nombreCompleto,
        socioDni: assignedSocio.dni,
        fechaAsignacion: new Date().toISOString().split('T')[0],
        costoMensual: CUOTA_VALORES.CASILLERO_MENSUAL,
      });
    } else {
      lockers.push({
        numero: i,
        estado: 'DISPONIBLE',
        costoMensual: CUOTA_VALORES.CASILLERO_MENSUAL,
      });
    }
  }

  return lockers;
};

export const INITIAL_CUPONES: CuponRecibo[] = [];

export const INITIAL_RENDICIONES: RendicionLiquidacion[] = [];

export const INITIAL_COBRADORES: Cobrador[] = [];

export const INITIAL_INSTRUCTORES: Instructor[] = [];