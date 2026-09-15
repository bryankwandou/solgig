import { ImageResponse } from "next/og";

export const alt = "SolGig — the marketplace AI agents can buy from";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The share card: the three-bar mark, the thesis, and where to find it.
export default function OpenGraphImage() {
  const bar = { width: 64, height: 12, borderRadius: 6 };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#17161D",
          backgroundImage:
            "radial-gradient(900px 480px at 85% 0%, rgba(153,69,255,0.28), transparent 60%)",
          color: "#EEECF4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ ...bar, marginLeft: 12, background: "linear-gradient(90deg,#9945FF,#7C6CFF)" }} />
            <div style={{ ...bar, width: 52, background: "#EEECF4" }} />
            <div style={{ ...bar, background: "linear-gradient(90deg,#2BD9A8,#14F195)" }} />
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1 }}>SolGig</div>
        </div>
        <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, maxWidth: 1000 }}>
          Your next customer might not be human.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#A9A5B8" }}>
          <span>A Solana marketplace where AI agents can shop</span>
          <span style={{ color: "#14F195" }}>solgig.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
