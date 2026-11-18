import api from "../api/axios";

/**
 * Desempaqueta automáticamente la respuesta si viene en el sobre estándar de NestJS: { data, timestamp }
 */
const extractData = (res) => {
  if (res && res.data !== undefined) {
    const body = res.data;
    if (body && typeof body === 'object' && 'data' in body && 'timestamp' in body) {
      return body.data;
    }
    return body;
  }
  return res;
};

/**
 * Hook genérico para manipulación de datos (CRUD)
 * @param {*} endpoint El endpoint a manipular
 * @returns
 */
export const useApi = (endpoint) => {
  /**
   * Función genérica GET
   * @param {*} id El id del endpoint
   * @returns
   */
  const get = async (id = "") => {
    try {
      const url = id ? `${endpoint}/${id}` : endpoint;
      const response = await api.get(url);
      return extractData(response);
    } catch (error) {
      console.error(`Error al obtener ${endpoint}: `, error);
      throw error;
    }
  };
  /**
   * Función genérica POST
   * @param {*} data Los datos a insertar
   * @returns
   */
  const create = async (data) => {
    try {
      const response = await api.post(endpoint, data);
      return extractData(response);
    } catch (error) {
      console.error(`Error al crear ${endpoint}: `, error);
      throw error;
    }
  };
  /**
   * Función genérica PATCH
   * @param {*} id El id del endpoint
   * @param {*} data Los datos a modificar
   * @returns
   */
  const update = async (id, data) => {
    try {
      const response = await api.patch(`${endpoint}/${id}`, data);
      return extractData(response);
    } catch (error) {
      console.error(`Error al actualizar ${endpoint}: `, error);
      throw error;
    }
  };
  /**
   * Función genérica DELETE
   * @param {*} id El id del endpoint
   */
  const remove = async (id) => {
    try {
      const response = await api.delete(`${endpoint}/${id}`);
      return extractData(response);
    } catch (error) {
      console.error(`Error al eliminar ${endpoint}: `, error);
      throw error;
    }
  };
  return { get, create, update, remove };
};
