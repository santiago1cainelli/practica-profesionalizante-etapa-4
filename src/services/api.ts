import {
  Socio,
  Cobrador,
  Instructor,
  Locker,
  Actividad,
  CuponRecibo,
  RendicionLiquidacion,
  AsistenciaRegistro,
  Familiar,
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Error HTTP ${res.status}: ${res.statusText}`;
    try {
      const json = await res.json();
      if (json && json.error) {
        errorMsg = json.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // DB status & full snapshot
  async getStatus(): Promise<{
    status: string;
    service: string;
    version: string;
    updatedAt: string;
    counts: Record<string, number>;
  }> {
    const res = await fetch('/api/status');
    return handleResponse(res);
  },

  async getFullDatabase(): Promise<{
    socios: Socio[];
    cobradores: Cobrador[];
    instructores: Instructor[];
    lockers: Locker[];
    actividades: Actividad[];
    cupones: CuponRecibo[];
    rendiciones: RendicionLiquidacion[];
    asistencias: AsistenciaRegistro[];
  }> {
    const res = await fetch('/api/database/all');
    return handleResponse(res);
  },

  async resetDatabase(): Promise<any> {
    const res = await fetch('/api/database/reset', { method: 'POST' });
    return handleResponse(res);
  },

  // Socios
  async getSocios(): Promise<Socio[]> {
    const res = await fetch('/api/socios');
    return handleResponse(res);
  },

  async addSocio(data: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>): Promise<Socio> {
    const res = await fetch('/api/socios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateSocio(id: string, data: Partial<Socio>): Promise<Socio> {
    const res = await fetch(`/api/socios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSocio(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/socios/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async addFamiliar(socioId: string, familiar: Omit<Familiar, 'id' | 'edad'>): Promise<Familiar> {
    const res = await fetch(`/api/socios/${socioId}/familiares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(familiar),
    });
    return handleResponse(res);
  },

  async removeFamiliar(socioId: string, familiarId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/socios/${socioId}/familiares/${familiarId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async regularizarDeuda(socioId: string): Promise<Socio> {
    const res = await fetch(`/api/socios/${socioId}/regularizar`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Cobradores
  async getCobradores(): Promise<Cobrador[]> {
    const res = await fetch('/api/cobradores');
    return handleResponse(res);
  },

  async addCobrador(data: Omit<Cobrador, 'id' | 'fechaAlta'>): Promise<Cobrador> {
    const res = await fetch('/api/cobradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateCobrador(id: string, data: Partial<Cobrador>): Promise<Cobrador> {
    const res = await fetch(`/api/cobradores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteCobrador(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/cobradores/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Instructores
  async getInstructores(): Promise<Instructor[]> {
    const res = await fetch('/api/instructores');
    return handleResponse(res);
  },

  async addInstructor(data: Omit<Instructor, 'id' | 'fechaAlta'>): Promise<Instructor> {
    const res = await fetch('/api/instructores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateInstructor(id: string, data: Partial<Instructor>): Promise<Instructor> {
    const res = await fetch(`/api/instructores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteInstructor(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/instructores/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Lockers
  async getLockers(): Promise<Locker[]> {
    const res = await fetch('/api/lockers');
    return handleResponse(res);
  },

  async assignLocker(numero: number, socioId: string): Promise<Locker> {
    const res = await fetch(`/api/lockers/${numero}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId }),
    });
    return handleResponse(res);
  },

  async releaseLocker(numero: number): Promise<Locker> {
    const res = await fetch(`/api/lockers/${numero}/release`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  async reserveLocker(numero: number): Promise<Locker> {
    const res = await fetch(`/api/lockers/${numero}/reserve`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  // Actividades
  async getActividades(): Promise<Actividad[]> {
    const res = await fetch('/api/actividades');
    return handleResponse(res);
  },

  async enrollActividad(socioId: string, actividadId: string): Promise<{ socio: Socio; actividad: Actividad }> {
    const res = await fetch('/api/actividades/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId, actividadId }),
    });
    return handleResponse(res);
  },

  async unenrollActividad(socioId: string, actividadId: string): Promise<{ socio: Socio; actividad: Actividad }> {
    const res = await fetch('/api/actividades/unenroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId, actividadId }),
    });
    return handleResponse(res);
  },

  // Cupones
  async getCupones(): Promise<CuponRecibo[]> {
    const res = await fetch('/api/cupones');
    return handleResponse(res);
  },

  async generarCupon(socioId: string): Promise<CuponRecibo> {
    const res = await fetch('/api/cupones/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId }),
    });
    return handleResponse(res);
  },

  async pagarCupon(cuponId: string, metodoPago: string, cobradorId?: string): Promise<CuponRecibo> {
    const res = await fetch(`/api/cupones/${cuponId}/pagar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodoPago, cobradorId }),
    });
    return handleResponse(res);
  },

  async moraCupon(cuponId: string): Promise<CuponRecibo> {
    const res = await fetch(`/api/cupones/${cuponId}/mora`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Rendiciones
  async getRendiciones(): Promise<RendicionLiquidacion[]> {
    const res = await fetch('/api/rendiciones');
    return handleResponse(res);
  },

  async addRendicion(data: Omit<RendicionLiquidacion, 'id' | 'fechaRendicion'>): Promise<RendicionLiquidacion> {
    const res = await fetch('/api/rendiciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async aprobarRendicion(id: string): Promise<RendicionLiquidacion> {
    const res = await fetch(`/api/rendiciones/${id}/aprobar`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  // Asistencias
  async getAsistencias(): Promise<AsistenciaRegistro[]> {
    const res = await fetch('/api/asistencias');
    return handleResponse(res);
  },

  async saveAsistencia(registro: AsistenciaRegistro): Promise<AsistenciaRegistro> {
    const res = await fetch('/api/asistencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro),
    });
    return handleResponse(res);
  },
};
