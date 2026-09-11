"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e1116",
          color: "#e7ecf3",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.16em", color: "#8b97a8" }}>
            UNAVAILABLE
          </p>
          <h1 style={{ fontSize: 28, margin: "8px 0" }}>The app did not load</h1>
          <p style={{ fontSize: 14, color: "#8b97a8" }}>
            {error.message || "An unexpected error stopped this page."}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              border: "1px solid #3d8bff",
              background: "transparent",
              color: "#7ec8ff",
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
