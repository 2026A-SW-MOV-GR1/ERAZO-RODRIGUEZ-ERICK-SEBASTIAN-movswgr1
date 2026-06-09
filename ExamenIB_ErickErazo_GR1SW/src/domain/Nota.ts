/** Entidad central del dominio. Inmutable por convención: las capas superiores nunca
 *  mutan un objeto Nota; siempre crean uno nuevo al actualizar. */
export type Nota = {
  id: string;
  titulo: string;
  contenido: string;
  /** Fecha de creación/modificación en formato ISO 8601 */
  fecha: string;
};
