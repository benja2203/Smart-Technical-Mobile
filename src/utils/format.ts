export function formatDate(dt: string | Date) {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}
