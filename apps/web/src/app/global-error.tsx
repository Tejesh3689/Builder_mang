'use client';

/** Last-resort boundary for errors in the root layout itself (must render its own <html>/<body>). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EAEAEA', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>The portal hit an unexpected error. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: 12, padding: '10px 16px', background: '#18181b', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
