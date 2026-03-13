/**
 * Parsea una fecha ISO (YYYY-MM-DD o datetime) de forma segura para cualquier
 * zona horaria. Las cadenas de solo fecha (YYYY-MM-DD) se interpretan como
 * mediodía local para evitar que UTC midnight desplace el día al parsear en
 * zonas horarias negativas (ej. Lima UTC-5).
 */
export function parseDate(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  // Si es solo fecha YYYY-MM-DD, añadir T12:00:00 para anclarla al mediodía local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }
  return new Date(dateStr);
}
