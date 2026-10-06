// Gera versões WebP leves das imagens do site público.
// Uso: node scripts/optimize-images.mjs
import { readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = join(process.cwd(), 'public/images/sermontiny');

// PNG originais → novo arquivo .webp (os PNG continuam para o PDF).
const CONVERT = [
  { file: 'hero-fachada.png', width: 1600, quality: 78 },
  { file: 'empresa-equipe.png', width: 1200, quality: 78 },
  { file: 'logo-guindaste.png', width: 1160, quality: 85 },
  { file: 'logo-oficial-nav.png', width: 560, quality: 90 },
];

// WebP já existentes: reduz no próprio arquivo, só se ficar menor.
const RECOMPRESS = [
  'projeto-industrial-01.webp',
  'projeto-industrial-02.webp',
  'projeto-industrial-03.webp',
  'equipamento-xcmg-60t.webp',
  'equipamento-xcmg-70t.webp',
  'equipamento-guindaste-90t.webp',
  'equipamento-madal-30t.webp',
  'hero-guindaste-industrial.webp',
  'cta-operacao-industrial.webp',
  'empresa-operacao-industrial.webp',
  'empresa-planta-industrial.webp',
  'servico-instalacoes.webp',
  'servico-montagem-industrial.webp',
  'servico-reservatorios.webp',
];

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function exists(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
}

for (const { file, width, quality } of CONVERT) {
  const input = join(DIR, file);
  const before = await exists(input);
  if (!before) continue;
  const output = input.replace(/\.png$/, '.webp');
  const buffer = await sharp(await readFile(input))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, alphaQuality: 100 })
    .toBuffer();
  await writeFile(output, buffer);
  console.log(`${file} ${kb(before)} -> ${output.split(/[\\/]/).pop()} ${kb(buffer.length)}`);
}

await unlink(join(DIR, 'logo-oficial-white.webp')).catch(() => {});

for (const file of RECOMPRESS) {
  const input = join(DIR, file);
  const before = await exists(input);
  if (!before) continue;
  // Lê para memória antes: no Windows o sharp trava o arquivo de entrada.
  const source = await readFile(input);
  const buffer = await sharp(source).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  if (buffer.length < before * 0.9) {
    await writeFile(input, buffer);
    console.log(`${file} ${kb(before)} -> ${kb(buffer.length)}`);
  } else {
    console.log(`${file} ${kb(before)} (mantido)`);
  }
}
