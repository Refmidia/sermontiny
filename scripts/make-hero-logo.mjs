// Remove o fundo preto do logo com guindaste e gera a versão transparente usada no topo do site.
// Uso: node scripts/make-hero-logo.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE = join(process.cwd(), 'scripts/assets/logo-sermontiny-guindaste.jpg');
const OUTPUT = join(process.cwd(), 'public/images/sermontiny/logo-guindaste.webp');

// Abaixo de LOW é fundo; acima de HIGH é logo; entre os dois vira borda suave.
// O azul-marinho mais escuro do logo fica perto de 90 no canal azul, bem acima do ruído do JPG.
const LOW = 22;
const HIGH = 64;

const { data, info } = await sharp(await readFile(SOURCE)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 4);

for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const peak = Math.max(r, g, b);
  const alpha = Math.min(1, Math.max(0, (peak - LOW) / (HIGH - LOW)));
  // Desfaz o escurecimento das bordas causado pela mistura com o preto.
  const scale = alpha > 0 ? Math.min(1 / alpha, 255 / Math.max(peak, 1)) : 0;
  out[j] = Math.round(r * scale);
  out[j + 1] = Math.round(g * scale);
  out[j + 2] = Math.round(b * scale);
  out[j + 3] = Math.round(alpha * 255);
}

const trimmed = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 0 })
  .png()
  .toBuffer();

// Aparece com no máximo 380px de largura; 760px cobre telas de alta densidade.
const webp = await sharp(trimmed)
  .resize({ width: 760, withoutEnlargement: true })
  .webp({ quality: 72, alphaQuality: 72, effort: 6 })
  .toBuffer({ resolveWithObject: true });

await writeFile(OUTPUT, webp.data);
console.log(`logo-guindaste.webp ${webp.info.width}x${webp.info.height} ${Math.round(webp.data.length / 1024)} KB`);
