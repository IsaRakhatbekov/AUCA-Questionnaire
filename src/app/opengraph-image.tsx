import { ImageResponse } from "next/og";

export const alt = "Анкета департаментов AUCA — редизайн сайта";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#0F2C5C",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 8,
            height: 64,
            background: "#A0780A",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 24,
            maxWidth: 900,
          }}
        >
          Анкета для департаментов
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "#C9D6E8",
            marginBottom: 40,
            maxWidth: 900,
          }}
        >
          Редизайн сайта AUCA
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#EEF3FA",
            maxWidth: 820,
            lineHeight: 1.45,
          }}
        >
          Сбор требований для технического задания. Заполните анкету вашего
          департамента.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 56,
            right: 80,
            fontSize: 20,
            color: "#0E9594",
            fontWeight: 700,
          }}
        >
          auca-questionnaire.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
