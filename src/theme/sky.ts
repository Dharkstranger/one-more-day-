// Sky colours for each Sunshine level, top to bottom. Night → Sunshine.
export const SKY_GRADIENTS: [string, string, string][] = [
  ['#070B1F', '#141A3D', '#262D63'], // Night
  ['#0E1433', '#2B2F66', '#6B4E8A'], // First Light
  ['#27306B', '#8A5A9E', '#F09A7E'], // Dawn
  ['#4A5BA8', '#F2A07B', '#FFD08A'], // Sunrise
  ['#4F8FDB', '#9CC9F2', '#FFE3A8'], // Morning
  ['#3E8DE8', '#86C3F7', '#E6F4FF'], // Midday
  ['#FF9F43', '#FFD166', '#FFF1C9'], // Sunshine
];

/** Whether text placed directly on the sky should be light. */
export const skyIsDark = (levelIndex: number) => levelIndex <= 3;

export const COLORS = {
  night: '#0B1026',
  sun: '#FFD166',
  amber: '#FFB547',
  cream: '#FFF7E8',
  ink: '#1C1B2E',
  mist: '#6E7191',
  sage: '#3FA37E',
  rose: '#F4A48C',
};
