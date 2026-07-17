function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

const palette = [
  { name: 'Coral Blush', hex: '#FF6F61' },
  { name: 'Midnight Indigo', hex: '#2C3E70' },
  { name: 'Sage Mist', hex: '#9CAF88' },
  { name: 'Amber Glow', hex: '#FFB627' },
  { name: 'Rose Quartz', hex: '#F7CAC9' },
  { name: 'Ocean Teal', hex: '#0F8B8D' },
  { name: 'Lavender Fog', hex: '#C3B1E1' },
  { name: 'Sunset Orange', hex: '#FF7A33' },
  { name: 'Emerald Forest', hex: '#0B6E4F' },
  { name: 'Slate Blue', hex: '#5C6BC0' },
  { name: 'Blush Pink', hex: '#FFC1CC' },
  { name: 'Golden Wheat', hex: '#F0C05A' },
  { name: 'Deep Plum', hex: '#5B2A5E' },
  { name: 'Sky Cyan', hex: '#4FC3F7' },
  { name: 'Terracotta', hex: '#C1502E' },
  { name: 'Mint Cream', hex: '#B7EFC5' },
  { name: 'Crimson Berry', hex: '#9B1B30' },
  { name: 'Charcoal Navy', hex: '#22303F' },
  { name: 'Peach Sorbet', hex: '#FFCBA4' },
  { name: 'Royal Violet', hex: '#6A0DAD' },
];

const colors = palette.map(({ name, hex }) => {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return {
    name,
    hex: hex.toUpperCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
});

module.exports = colors;
