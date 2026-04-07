import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#081120",
          borderRadius: "8px",
          color: "#d8aa39",
          fontSize: "22px",
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
