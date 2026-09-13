import { ImageResponse } from "next/og";
import { publicEnv } from "@/lib/public-env";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${publicEnv.NEXT_PUBLIC_COMPANY_NAME} — Afiliación a Salud, Pensión y ARL`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, display: "flex" }}>
          {publicEnv.NEXT_PUBLIC_COMPANY_NAME}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            display: "flex",
            opacity: 0.9,
          }}
        >
          Afiliación a Salud, Pensión y ARL en Colombia
        </div>
      </div>
    ),
    { ...size },
  );
}
