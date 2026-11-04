import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Socio,
  Locker,
  Actividad,
  CuponRecibo,
  RendicionLiquidacion,
  Cobrador,
  Instructor,
  AsistenciaRegistro,
  Familiar,
  SocioEstado,
  SocioCategoria,
} from '../src/types';
import {
  INITIAL_SOCIOS,
  INITIAL_ACTIVIDADES,
  generateInitialLockers,
  INITIAL_CUPONES,
  INITIAL_RENDICIONES,
  INITIAL_COBRADORES,
  INITIAL_INSTRUCTORES,
  CUOTA_VALORES,
} from '../src/data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  socios: Socio[];
  cobradores: Cobrador[];
  instructores: Instructor[];
  lockers: Locker[];
  actividades: Actividad[];
  cupones: CuponRecibo[];
  rendiciones: RendicionLiquidacion[];
  asistencias: AsistenciaRegistro[];
}

let dbCache: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function calculateSocioCategoria(fechaNacimiento: string, fechaIngreso: string): { categoria: SocioCategoria; edad: number; antiguedadAnios: number } {
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
}

function refreshMorosidadInSocios(sociosList: Socio[], cuponesList: CuponRecibo[]): Socio[] {
  return sociosList.map((socio) => {
    const impagos = cuponesList.filter(
      (c) => c.socioId === socio.id && (c.estadoPago === 'PENDIENTE' || c.estadoPago === 'VENCIDO')
    );
    const cantImpagos = impagos.length;
    let nuevoEstado: SocioEstado = 'AL_DIA';

    if (cantImpagos >= 2) {
      nuevoEstado = 'SUSPENDIDO_MOROSIDAD';
    } else if (cantImpagos === 1) {
      nuevoEstado = 'DEUDOR_1_MES';
    }

    return {
      ...socio,
      cuotasAdeudadas: cantImpagos,
      estado: nuevoEstado,
    };
  });
}

function getInitialDatabase(): DatabaseSchema {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    socios: INITIAL_SOCIOS,
    cobradores: INITIAL_COBRADORES,
    instructores: INITIAL_INSTRUCTORES,
    lockers: generateInitialLockers(INITIAL_SOCIOS),
    actividades: INITIAL_ACTIVIDADES,
    cupones: INITIAL_CUPONES,
    rendiciones: INITIAL_RENDICIONES,
    asistencias: [
      {
        id: 'asis-1',
        actividadId: 'act-1',
        fecha: '2026-09-15',
        instructorId: 'user-instructor',
        asistencias: [
          { socioId: 'soc-1', socioNombre: 'Martín Rossi', presente: true },
          { socioId: 'soc-4', socioNombre: 'Lucía Lapenta Olmos', presente: true },
          { socioId: 'soc-6', socioNombre: 'Claudio Domínguez', presente: false },
        ],
      },
    ],
  };
}

export function initDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      if (dbCache && Array.isArray(dbCache.socios)) {
        console.log(`[Database] Loaded persistent data from ${DB_FILE} with ${dbCache.socios.length} socios.`);
        return dbCache;
      }
    } catch (e) {
      console.error('[Database] Failed to read existing database. Re-seeding...', e);
    }
  }

  dbCache = getInitialDatabase();
  persistDatabaseSync(dbCache);
  console.log(`[Database] Initialized new persistent database at ${DB_FILE}`);
  return dbCache;
}

function persistDatabaseSync(data: DatabaseSchema) {
  try {
    data.updatedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Database] Error saving to disk:', err);
  }
}

async function persistDatabaseAsync(): Promise<void> {
  if (!dbCache) return;
  const snapshot = JSON.stringify(dbCache, null, 2);
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.promises.writeFile(tempFile, snapshot, 'utf-8');
      await fs.promises.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Async write error:', err);
    }
  });
  return writeQueue;
}

export const db = {
  getData(): DatabaseSchema {
    return initDatabase();
  },

  // RESET
  async reset(): Promise<DatabaseSchema> {
    dbCache = getInitialDatabase();
    await persistDatabaseAsync();
    return dbCache;
  },

  // SOCIOS
  getSocios(): Socio[] {
    const data = initDatabase();
    return data.socios;
  },

  async addSocio(input: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>): Promise<Socio> {
    const data = initDatabase();
    const existe = data.socios.some((s) => s.dni.trim() === input.dni.trim());
    if (existe) {
      throw new Error(`Ya existe un socio registrado con el DNI ${input.dni}`);
    }

    const { categoria, edad, antiguedadAnios } = calculateSocioCategoria(input.fechaNacimiento, input.fechaIngreso);
    const maxNum = data.socios.reduce((max, s) => Math.max(max, s.numeroSocio), 1000);
    const nuevoNumero = maxNum + 1;

    const newSocio: Socio = {
      ...input,
      id: `soc-${Date.now()}`,
      numeroSocio: nuevoNumero,
      edad,
      antiguedadAnios,
      categoria,
      estado: 'AL_DIA',
      cuotasAdeudadas: 0,
      familiares: input.familiares || [],
      actividadesIds: input.actividadesIds || [],
    };

    data.socios = [newSocio, ...data.socios];
    await persistDatabaseAsync();
    return newSocio;
  },

  async updateSocio(id: string, updates: Partial<Socio>): Promise<Socio> {
    const data = initDatabase();
    const index = data.socios.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Socio con ID ${id} no encontrado`);
    }

    const existing = data.socios[index];
    const merged = { ...existing, ...updates };
    const { categoria, edad, antiguedadAnios } = calculateSocioCategoria(merged.fechaNacimiento, merged.fechaIngreso);

    data.socios[index] = {
      ...merged,
      categoria,
      edad,
      antiguedadAnios,
    };

    await persistDatabaseAsync();
    return data.socios[index];
  },

  async deleteSocio(id: string): Promise<boolean> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === id);
    if (!socio) return false;

    // Liberar casillero si tenía
    if (socio.casilleroAsignadoId) {
      const lIndex = data.lockers.findIndex((l) => l.numero === socio.casilleroAsignadoId);
      if (lIndex !== -1) {
        data.lockers[lIndex] = {
          ...data.lockers[lIndex],
          estado: 'DISPONIBLE',
          socioId: undefined,
          socioNombre: undefined,
          socioDni: undefined,
          fechaAsignacion: undefined,
        };
      }
    }

    data.socios = data.socios.filter((s) => s.id !== id);
    await persistDatabaseAsync();
    return true;
  },

  async addFamiliar(socioId: string, familiarData: Omit<Familiar, 'id' | 'edad'>): Promise<Familiar> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    if (!socio) throw new Error('Socio no encontrado');

    const hoy = new Date();
    const nac = new Date(familiarData.fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    if (isNaN(edad) || edad < 0) edad = 0;

    const newFam: Familiar = {
      ...familiarData,
      id: `fam-${Date.now()}`,
      edad,
    };

    socio.familiares = [...socio.familiares, newFam];
    socio.esTitularFamilia = true;
    await persistDatabaseAsync();
    return newFam;
  },

  async removeFamiliar(socioId: string, familiarId: string): Promise<boolean> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    if (!socio) return false;

    socio.familiares = socio.familiares.filter((f) => f.id !== familiarId);
    socio.esTitularFamilia = socio.familiares.length > 0;
    await persistDatabaseAsync();
    return true;
  },

  async regularizarDeuda(socioId: string): Promise<Socio> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    if (!socio) throw new Error('Socio no encontrado');

    const fechaPago = new Date().toISOString().split('T')[0];
    data.cupones = data.cupones.map((c) =>
      c.socioId === socioId && c.estadoPago !== 'PAGADO'
        ? {
            ...c,
            estadoPago: 'PAGADO',
            fechaPago,
            metodoPago: 'SEDE_CENTRAL',
            cobradorId: 'sede-central',
          }
        : c
    );

    socio.estado = 'AL_DIA';
    socio.cuotasAdeudadas = 0;
    await persistDatabaseAsync();
    return socio;
  },

  // COBRADORES
  getCobradores(): Cobrador[] {
    return initDatabase().cobradores;
  },

  async addCobrador(input: Omit<Cobrador, 'id' | 'fechaAlta'>): Promise<Cobrador> {
    const data = initDatabase();
    const existe = data.cobradores.some((c) => c.dni.trim() === input.dni.trim());
    if (existe) {
      throw new Error(`Ya existe un cobrador con DNI ${input.dni}`);
    }

    const newCobrador: Cobrador = {
      ...input,
      id: `cob-${Date.now()}`,
      fechaAlta: new Date().toISOString().split('T')[0],
    };

    data.cobradores = [newCobrador, ...data.cobradores];
    await persistDatabaseAsync();
    return newCobrador;
  },

  async updateCobrador(id: string, updates: Partial<Cobrador>): Promise<Cobrador> {
    const data = initDatabase();
    const index = data.cobradores.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cobrador no encontrado');

    data.cobradores[index] = { ...data.cobradores[index], ...updates };
    await persistDatabaseAsync();
    return data.cobradores[index];
  },

  async deleteCobrador(id: string): Promise<boolean> {
    const data = initDatabase();
    data.cobradores = data.cobradores.filter((c) => c.id !== id);
    await persistDatabaseAsync();
    return true;
  },

  // INSTRUCTORES
  getInstructores(): Instructor[] {
    return initDatabase().instructores;
  },

  async addInstructor(input: Omit<Instructor, 'id' | 'fechaAlta'>): Promise<Instructor> {
    const data = initDatabase();
    const existe = data.instructores.some((i) => i.dni.trim() === input.dni.trim());
    if (existe) {
      throw new Error(`Ya existe un instructor con DNI ${input.dni}`);
    }

    const newInstructor: Instructor = {
      ...input,
      id: `inst-${Date.now()}`,
      fechaAlta: new Date().toISOString().split('T')[0],
    };

    data.instructores = [newInstructor, ...data.instructores];

    // Sincronizar en actividades
    if (input.disciplinasIds && input.disciplinasIds.length > 0) {
      data.actividades = data.actividades.map((a) =>
        input.disciplinasIds.includes(a.id)
          ? { ...a, instructorId: newInstructor.id, instructorNombre: newInstructor.nombreCompleto }
          : a
      );
    }

    await persistDatabaseAsync();
    return newInstructor;
  },

  async updateInstructor(id: string, updates: Partial<Instructor>): Promise<Instructor> {
    const data = initDatabase();
    const index = data.instructores.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Instructor no encontrado');

    data.instructores[index] = { ...data.instructores[index], ...updates };

    // Sincronizar actividades
    if (updates.nombreCompleto !== undefined || updates.disciplinasIds !== undefined) {
      data.actividades = data.actividades.map((a) => {
        if (updates.disciplinasIds?.includes(a.id)) {
          return {
            ...a,
            instructorId: id,
            instructorNombre: updates.nombreCompleto || a.instructorNombre,
          };
        }
        if (a.instructorId === id && updates.disciplinasIds && !updates.disciplinasIds.includes(a.id)) {
          return { ...a, instructorId: 'sin-asignar', instructorNombre: 'A designar' };
        }
        if (a.instructorId === id && updates.nombreCompleto) {
          return { ...a, instructorNombre: updates.nombreCompleto };
        }
        return a;
      });
    }

    await persistDatabaseAsync();
    return data.instructores[index];
  },

  async deleteInstructor(id: string): Promise<boolean> {
    const data = initDatabase();
    data.instructores = data.instructores.filter((i) => i.id !== id);
    data.actividades = data.actividades.map((a) =>
      a.instructorId === id ? { ...a, instructorId: 'sin-asignar', instructorNombre: 'A designar' } : a
    );
    await persistDatabaseAsync();
    return true;
  },

  // LOCKERS
  getLockers(): Locker[] {
    return initDatabase().lockers;
  },

  async assignLocker(numero: number, socioId: string): Promise<Locker> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    if (!socio) throw new Error('Socio no encontrado');
    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') {
      throw new Error('Socio suspendido por morosidad');
    }
    if (socio.casilleroAsignadoId && socio.casilleroAsignadoId !== numero) {
      throw new Error(`El socio ya tiene el casillero N° ${socio.casilleroAsignadoId}`);
    }

    const lockerIndex = data.lockers.findIndex((l) => l.numero === numero);
    if (lockerIndex === -1) throw new Error('Casillero no encontrado');

    data.lockers[lockerIndex] = {
      ...data.lockers[lockerIndex],
      estado: 'OCUPADO',
      socioId: socio.id,
      socioNombre: socio.nombreCompleto,
      socioDni: socio.dni,
      fechaAsignacion: new Date().toISOString().split('T')[0],
    };

    socio.casilleroAsignadoId = numero;
    await persistDatabaseAsync();
    return data.lockers[lockerIndex];
  },

  async releaseLocker(numero: number): Promise<Locker> {
    const data = initDatabase();
    const lockerIndex = data.lockers.findIndex((l) => l.numero === numero);
    if (lockerIndex === -1) throw new Error('Casillero no encontrado');

    const locker = data.lockers[lockerIndex];
    if (locker.socioId) {
      const socio = data.socios.find((s) => s.id === locker.socioId);
      if (socio) socio.casilleroAsignadoId = undefined;
    }

    data.lockers[lockerIndex] = {
      ...locker,
      estado: 'DISPONIBLE',
      socioId: undefined,
      socioNombre: undefined,
      socioDni: undefined,
      fechaAsignacion: undefined,
    };

    await persistDatabaseAsync();
    return data.lockers[lockerIndex];
  },

  async reserveLocker(numero: number): Promise<Locker> {
    const data = initDatabase();
    const lockerIndex = data.lockers.findIndex((l) => l.numero === numero);
    if (lockerIndex === -1) throw new Error('Casillero no encontrado');

    const current = data.lockers[lockerIndex];
    const nuevoEstado = current.estado === 'RESERVADO' ? 'DISPONIBLE' : 'RESERVADO';
    data.lockers[lockerIndex] = { ...current, estado: nuevoEstado };
    await persistDatabaseAsync();
    return data.lockers[lockerIndex];
  },

  // ACTIVIDADES
  getActividades(): Actividad[] {
    return initDatabase().actividades;
  },

  async enrollActividad(socioId: string, actividadId: string): Promise<{ socio: Socio; actividad: Actividad }> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    const actividad = data.actividades.find((a) => a.id === actividadId);
    if (!socio || !actividad) throw new Error('Socio o actividad no encontrada');
    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') throw new Error('Socio suspendido por morosidad');
    if (socio.actividadesIds.includes(actividadId)) throw new Error('Ya inscripto en la actividad');
    if (actividad.cupoOcupado >= actividad.cupoMaximo) throw new Error('Cupo máximo alcanzado');

    socio.actividadesIds = [...socio.actividadesIds, actividadId];
    actividad.cupoOcupado += 1;
    await persistDatabaseAsync();
    return { socio, actividad };
  },

  async unenrollActividad(socioId: string, actividadId: string): Promise<{ socio: Socio; actividad: Actividad }> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    const actividad = data.actividades.find((a) => a.id === actividadId);
    if (!socio || !actividad) throw new Error('Socio o actividad no encontrada');

    socio.actividadesIds = socio.actividadesIds.filter((id) => id !== actividadId);
    actividad.cupoOcupado = Math.max(0, actividad.cupoOcupado - 1);
    await persistDatabaseAsync();
    return { socio, actividad };
  },

  // CUPONES
  getCupones(): CuponRecibo[] {
    return initDatabase().cupones;
  },

  async generarCupon(socioId: string): Promise<CuponRecibo> {
    const data = initDatabase();
    const socio = data.socios.find((s) => s.id === socioId);
    if (!socio) throw new Error('Socio no encontrado');

    let cuotaSocialBase = CUOTA_VALORES.ACTIVO;
    if (socio.categoria === 'CADETE') cuotaSocialBase = CUOTA_VALORES.CADETE;
    if (socio.categoria === 'VITALICIO') cuotaSocialBase = CUOTA_VALORES.VITALICIO;

    const detalleActividades = socio.actividadesIds
      .map((actId) => {
        const act = data.actividades.find((a) => a.id === actId);
        return act ? { nombre: act.nombre, monto: act.costoMensual } : null;
      })
      .filter(Boolean) as { nombre: string; monto: number }[];

    const costoActividades = detalleActividades.reduce((sum, a) => sum + a.monto, 0);
    const costoCasillero = socio.casilleroAsignadoId ? CUOTA_VALORES.CASILLERO_MENSUAL : 0;
    const hijosCount = socio.familiares.filter((f) => f.parentesco === 'HIJO' || f.parentesco === 'HIJA').length;
    const descuentoFamiliar = hijosCount * CUOTA_VALORES.DESCUENTO_FAMILIAR_POR_HIJO;

    const subtotal = Math.max(0, cuotaSocialBase + costoActividades + costoCasillero - descuentoFamiliar);
    const tieneMora = socio.cuotasAdeudadas > 0;
    const recargoMoraPorcentaje = tieneMora ? CUOTA_VALORES.RECARGO_MORA_PORCENTAJE : 0;
    const montoRecargoMora = tieneMora ? Math.round(subtotal * CUOTA_VALORES.RECARGO_MORA_PORCENTAJE) : 0;
    const totalPagar = subtotal + montoRecargoMora;

    const hoy = new Date();
    const periodoMes = hoy.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const fechaEmision = hoy.toISOString().split('T')[0];
    const vencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), 15).toISOString().split('T')[0];

    const nuevoCupon: CuponRecibo = {
      id: `cup-${Date.now()}`,
      numeroComprobante: `REC-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      socioId: socio.id,
      socioNombre: socio.nombreCompleto,
      socioDni: socio.dni,
      zonaCobro: socio.zonaCobro,
      periodoMes: periodoMes.charAt(0).toUpperCase() + periodoMes.slice(1),
      fechaEmision,
      fechaVencimiento: vencimiento,
      cuotaSocialBase,
      detalleActividades,
      costoCasillero,
      recargoMoraPorcentaje,
      montoRecargoMora,
      descuentoFamiliar,
      subtotal,
      totalPagar,
      estadoPago: 'PENDIENTE',
    };

    data.cupones = [nuevoCupon, ...data.cupones];
    data.socios = refreshMorosidadInSocios(data.socios, data.cupones);
    await persistDatabaseAsync();
    return nuevoCupon;
  },

  async pagarCupon(cuponId: string, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string): Promise<CuponRecibo> {
    const data = initDatabase();
    const cupon = data.cupones.find((c) => c.id === cuponId);
    if (!cupon) throw new Error('Cupón no encontrado');

    cupon.estadoPago = 'PAGADO';
    cupon.fechaPago = new Date().toISOString().split('T')[0];
    cupon.metodoPago = metodoPago;
    cupon.cobradorId = cobradorId || 'sede-central';

    data.socios = refreshMorosidadInSocios(data.socios, data.cupones);
    await persistDatabaseAsync();
    return cupon;
  },

  async aplicarMoraCupon(cuponId: string): Promise<CuponRecibo> {
    const data = initDatabase();
    const cupon = data.cupones.find((c) => c.id === cuponId);
    if (!cupon) throw new Error('Cupón no encontrado');

    const subtotal = cupon.subtotal;
    const montoRecargoMora = Math.round(subtotal * CUOTA_VALORES.RECARGO_MORA_PORCENTAJE);
    cupon.recargoMoraPorcentaje = CUOTA_VALORES.RECARGO_MORA_PORCENTAJE;
    cupon.montoRecargoMora = montoRecargoMora;
    cupon.totalPagar = subtotal + montoRecargoMora;
    cupon.estadoPago = 'VENCIDO';

    await persistDatabaseAsync();
    return cupon;
  },

  // RENDICIONES
  getRendiciones(): RendicionLiquidacion[] {
    return initDatabase().rendiciones;
  },

  async addRendicion(input: Omit<RendicionLiquidacion, 'id' | 'fechaRendicion'>): Promise<RendicionLiquidacion> {
    const data = initDatabase();
    const nueva: RendicionLiquidacion = {
      ...input,
      id: `rend-${Date.now()}`,
      fechaRendicion: new Date().toISOString().split('T')[0],
    };
    data.rendiciones = [nueva, ...data.rendiciones];
    await persistDatabaseAsync();
    return nueva;
  },

  async aprobarRendicion(id: string): Promise<RendicionLiquidacion> {
    const data = initDatabase();
    const r = data.rendiciones.find((rend) => rend.id === id);
    if (!r) throw new Error('Rendición no encontrada');
    r.estado = 'APROBADA';
    await persistDatabaseAsync();
    return r;
  },

  // ASISTENCIAS
  getAsistencias(): AsistenciaRegistro[] {
    return initDatabase().asistencias;
  },

  async saveAsistencia(registro: AsistenciaRegistro): Promise<AsistenciaRegistro> {
    const data = initDatabase();
    const idx = data.asistencias.findIndex(
      (r) => r.actividadId === registro.actividadId && r.fecha === registro.fecha
    );
    if (idx >= 0) {
      data.asistencias[idx] = registro;
    } else {
      data.asistencias = [registro, ...data.asistencias];
    }
    await persistDatabaseAsync();
    return registro;
  },
};
