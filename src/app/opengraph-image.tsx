import { ImageResponse } from 'next/og';

export const alt = 'Vitriona — Crea tu tienda online con IA y WhatsApp';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'linear-gradient(135deg, #0f0a1f 0%, #1a1033 50%, #2d1b5e 100%)',
        padding: '80px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          display: 'flex',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 20px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#c4b5fd',
          fontSize: '22px',
          fontWeight: 600,
        }}
      >
        Vitriona
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '40px',
          color: 'white',
          fontSize: '76px',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          maxWidth: '1000px',
        }}
      >
        <span>Crea tu tienda online</span>
        <span
          style={{
            display: 'flex',
            background: 'linear-gradient(90deg, #a78bfa 0%, #c084fc 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          con IA y WhatsApp
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: '32px',
          color: '#cbd5e1',
          fontSize: '30px',
          fontWeight: 400,
          maxWidth: '900px',
          lineHeight: 1.3,
        }}
      >
        Ecommerce todo-en-uno con chatbot IA, POS, agenda de citas y checkout por WhatsApp.
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginTop: '48px',
        }}
      >
        <div
          style={{
            padding: '14px 28px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            color: 'white',
            fontSize: '24px',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          Empezar gratis
        </div>
        <div
          style={{
            color: '#94a3b8',
            fontSize: '22px',
            display: 'flex',
          }}
        >
          vitriona.app
        </div>
      </div>
    </div>,
    size
  );
}
