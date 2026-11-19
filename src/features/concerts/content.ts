const plainText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex -- Remove non-printing source controls, preserving line breaks.
  const text = value.replaceAll(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  return text.trim() || undefined;
};

// CT description templates use bracketed instructions. Keep the whole section out of public facts.
export const factualText = (value: unknown): string | undefined => {
  const text = plainText(value);
  if (!text || /\[[\s\S]*?\]|\{\{[\s\S]*?\}\}/.test(text)) return undefined;
  return text;
};

// A native subtitle may contain annotations; standalone brackets and mustache fields are prompts.
export const subtitleText = (value: unknown): string | undefined => {
  const text = plainText(value);
  if (!text || /^\[[\s\S]*\]$|\{\{[\s\S]*?\}\}/.test(text)) return undefined;
  return text;
};

export const safeUrl = (value: unknown, base?: URL): string | undefined => {
  const text = factualText(value);
  // eslint-disable-next-line no-control-regex -- Reject embedded whitespace/control characters in URLs.
  if (!text || /[\u0000-\u0020\u007f]/.test(text)) return undefined;
  try {
    const url = new URL(text, base);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};

const berlinDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function eventDate(value: unknown, timeUnknown = false): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/
  );
  if (!match || !Number.isFinite(Date.parse(value))) return undefined;
  const [, day, hour, minute, second, zone] = match;
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return undefined;
  if (hour && (Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59))
    return undefined;
  if (zone && zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))
    return undefined;
  return timeUnknown && hour ? berlinDate.format(new Date(value)) : value;
}

export const normalizeFocus = (value?: number | string) => {
  const coordinate =
    typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN;
  return Number.isFinite(coordinate) ? Math.min(1, Math.max(0, coordinate)) : 0.5;
};
