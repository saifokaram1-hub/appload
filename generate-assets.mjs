import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('assets', { recursive: true });

const mark = `
  <path d='M16 8l6 10.5H10L16 8z' fill='#ffffff'/>
  <circle cx='16' cy='22' r='2.2' fill='#ffffff'/>`;

const iconOnly = `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 32 32'>
  <rect width='32' height='32' rx='7' fill='#c6a24c'/>${mark}</svg>`;

const iconForeground = `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 32 32'>${mark}</svg>`;

const iconBackground = `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>
  <rect width='1024' height='1024' fill='#c6a24c'/></svg>`;

const splash = (bg) => `<svg xmlns='http://www.w3.org/2000/svg' width='2732' height='2732' viewBox='0 0 2732 2732'>
  <rect width='2732' height='2732' fill='${bg}'/>
  <g transform='translate(966,966) scale(25)'>
    <rect width='32' height='32' rx='7' fill='#c6a24c'/>${mark}
  </g></svg>`;

async function render(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(`assets/${file}`);
  console.log('  ✓ assets/' + file);
}

await render(iconOnly, 'icon-only.png');
await render(iconForeground, 'icon-foreground.png');
await render(iconBackground, 'icon-background.png');
await render(splash('#faf9f5'), 'splash.png');
await render(splash('#1c1b18'), 'splash-dark.png');
console.log('Quell-Assets erstellt.');
