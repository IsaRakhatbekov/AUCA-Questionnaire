import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Анкета департаментов AUCA — редизайн сайта";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoBuffer = await readFile(join(process.cwd(), "public/AUCA.jpeg"));
  const logoSrc = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F2C5C",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={logoSrc}
          width={220}
          height={220}
          alt=""
          style={{ objectFit: "contain", marginBottom: 36 }}
        />
        <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 12 }}>
          Анкета для департаментов
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, color: "#C9D6E8" }}>
          Редизайн сайта AUCA
        </div>
      </div>
    ),
    { ...size },
  );
}
