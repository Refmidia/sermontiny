import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: '#0a1f3d',
          color: '#f7f4ea',
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: '#c4a35a' }}>TARUMÃ / SP</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16 }}>SERMONTINY</div>
        <div style={{ fontSize: 28, marginTop: 12, maxWidth: 820 }}>
          Montagens industriais, estruturas metálicas e locação de equipamentos.
        </div>
      </div>
    ),
    size,
  );
}
