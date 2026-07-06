export interface PlatformUnitType {
  value: string;
  label: string;
}

export const PLATFORM_UNIT_TYPES: PlatformUnitType[] = [
  { value: 'STUDIO', label: 'Studio / Bedsitter' },
  { value: 'ONE_BEDROOM', label: '1 Bedroom' },
  { value: 'TWO_BEDROOM', label: '2 Bedroom' },
  { value: 'THREE_BEDROOM', label: '3 Bedroom' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' }
];

export const UNIT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORM_UNIT_TYPES.map((t) => [t.value, t.label])
);

export function unitTypeLabel(code?: string | null): string {
  if (!code) return 'Unit';
  return UNIT_TYPE_LABELS[code] || code.replace(/_/g, ' ').toLowerCase();
}
