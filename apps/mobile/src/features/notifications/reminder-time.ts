export function reminderLocalParts(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const pad = (part: number) => String(part).padStart(2, '0');
  return { date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
}

export function reminderInstant(date: string, time: string | null, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('צריך לבחור תאריך ושעה לתזכורת.');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const local = new Date(year!, month! - 1, day!, hour!, minute!, 0, 0);
  // Reject nonexistent DST wall-clock times instead of silently normalizing them.
  if (local.getFullYear() !== year || local.getMonth() !== month! - 1 || local.getDate() !== day || local.getHours() !== hour || local.getMinutes() !== minute) throw new Error('השעה אינה קיימת בתאריך הזה במכשיר. צריך לבחור שעה אחרת.');
  if (local.getTime() <= now) throw new Error('צריך לבחור תזכורת בעתיד.');
  return local.toISOString();
}
