import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #081120 0%, #0f1d35 65%, #163052 100%)",
          borderRadius: "42px",
          color: "#f2d071",
          fontSize: "112px",
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        I
      </div>
    ),
    size,
  );
}
