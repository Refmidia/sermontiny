// Gera versões menores (640/1024px) das fotos do site para o srcset.
// Uso: node scripts/responsive-images.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = join(process.cwd(), 'public/images/sermontiny');
const MANIFEST = join(process.cwd(), 'lib/content/image-variants.json');
const WIDTHS = [640, 1024];
const VARIANT = /-(\d+)w\.webp$/;

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const manifest = {};

const files = (await readdir(DIR)).filter((file) => file.endsWith('.webp') && !file.startsWith('logo-') && !VARIANT.test(file));

for (const file of files) {
  // Lê para memória antes: no Windows o sharp trava o arquivo de entrada.
  const source = await readFile(join(DIR, file));
  const { width: original } = await sharp(source).metadata();
  const entries = [];
  for (const width of WIDTHS) {
    if (!original || width >= original * 0.9) continue;
    const name = file.replace(/\.webp$/, `-${width}w.webp`);
    const buffer = await sharp(source).resize({ width }).webp({ quality: 72 }).toBuffer();
    await writeFile(join(DIR, name), buffer);
    entries.push([`/images/sermontiny/${name}`, width]);
    console.log(`${name} ${kb(buffer.length)}`);
  }
  if (entries.length) {
    entries.push([`/images/sermontiny/${file}`, original]);
    manifest[`/images/sermontiny/${file}`] = entries;
  }
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifesto: ${Object.keys(manifest).length} imagens`);
