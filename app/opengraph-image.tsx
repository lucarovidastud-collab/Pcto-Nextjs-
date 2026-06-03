import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QuoteGen Engine — AI Proposal Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f1d2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(13,148,136,0.25)",
            filter: "blur(80px)",
            display: "flex"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: 200,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(139,92,246,0.2)",
            filter: "blur(60px)",
            display: "flex"
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0d9488, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "white"
            }}
          >
            ✦
          </div>
          <span style={{ color: "#94a3b8", fontSize: 22, fontWeight: 600 }}>
            QuoteGen Engine
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#f8fafc",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 24,
            maxWidth: 900
          }}
        >
          Preventivi AI con{" "}
          <span style={{ color: "#0d9488" }}>Brand Styling</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: "#94a3b8",
            fontSize: 26,
            margin: 0,
            maxWidth: 750,
            lineHeight: 1.4
          }}
        >
          Genera proposte commerciali brandizzate in pochi secondi.
          Link firmabile, palette estratta dal sito del cliente.
        </p>

        {/* Bottom tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48
          }}
        >
          {["AI Generativa", "Firma Digitale", "Multi-lingua"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(13,148,136,0.15)",
                border: "1px solid rgba(13,148,136,0.3)",
                borderRadius: 8,
                padding: "8px 18px",
                color: "#5eead4",
                fontSize: 18,
                fontWeight: 600,
                display: "flex"
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
