import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Intellink";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, rgba(216,170,57,0.28), transparent 26%), linear-gradient(135deg, #081120 0%, #0f1d35 55%, #132742 100%)",
          color: "white",
          padding: "64px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "24px",
            borderRadius: "36px",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "22px",
                background: "#d8aa39",
                color: "#081120",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: 800,
              }}
            >
              I
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "26px",
                  letterSpacing: "0.32em",
                  color: "#f7d889",
                }}
              >
                INTELLINK
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Premium SaaS for experts and professionals
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              maxWidth: "900px",
            }}
          >
            <div
              style={{
                fontSize: "84px",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "-0.05em",
              }}
            >
              Get paid for what you know.
            </div>
            <div
              style={{
                fontSize: "30px",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Sell paid Q&A, sessions, and digital resources with subscription-first access and instant expert payouts.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            {["Premium subscriptions", "Direct client payments", "Instant payouts"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    padding: "16px 24px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
