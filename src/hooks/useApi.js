import api from "../api/axios";
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      await api.delete(`${endpoint}/${id}`);
    } catch (error) {
      console.error(`Error al eliminar ${endpoint}: `, error);
      throw error;
    }
  };
  return { get, create, update, remove };
};
