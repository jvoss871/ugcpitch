import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#030712',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Teal glow blob */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20,184,166,0.12)',
          border: '1px solid rgba(20,184,166,0.25)',
          color: '#2dd4bf',
          fontSize: '16px',
          fontWeight: '700',
          padding: '8px 18px',
          borderRadius: '999px',
          marginBottom: '36px',
          letterSpacing: '0.02em',
        }}>
          Built for UGC creators
        </div>

        {/* Headline */}
        <div style={{
          fontSize: '82px',
          fontWeight: '900',
          color: '#ffffff',
          lineHeight: 1.05,
          marginBottom: '28px',
          letterSpacing: '-3px',
        }}>
          The pitch page<br />
          that gets you{' '}
          <span style={{ color: '#2dd4bf' }}>picked.</span>
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: '24px',
          color: '#9ca3af',
          lineHeight: 1.5,
          marginBottom: '56px',
          maxWidth: '640px',
        }}>
          Paste a brand listing. Get a tailored pitch page with your best content — ready to send in 30 seconds.
        </div>

        {/* Bottom wordmark */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#14b8a6',
          }} />
          <div style={{
            fontSize: '22px',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '-0.5px',
          }}>
            UGC Edge
          </div>
          <div style={{
            fontSize: '22px',
            color: '#374151',
            marginLeft: '4px',
          }}>
            · ugcedge.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
