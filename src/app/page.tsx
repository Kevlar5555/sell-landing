import { BlikCheckout } from "@/components/BlikCheckout";

export default function HomePage() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(120% 80% at 0% 0%, #1c130c 0%, transparent 55%), linear-gradient(145deg, #0a0705 0%, #120d09 45%, #1a1008 100%)",
      }}
    >
      <div
        aria-hidden
        className="glow-orb"
        style={{
          position: "absolute",
          right: "-8%",
          top: "8%",
          width: "min(72vw, 640px)",
          height: "min(72vw, 640px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 40%, rgba(232,188,106,0.95) 0%, rgba(196,122,40,0.55) 28%, rgba(90,45,12,0.22) 55%, transparent 72%)",
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 55%, transparent 0%, rgba(10,7,5,0.35) 45%, rgba(10,7,5,0.88) 100%)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "1.5rem clamp(1.25rem, 4vw, 3rem)",
        }}
      >
        <div className="anim-fade-up">
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.35rem)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              lineHeight: 1,
            }}
          >
            KNOT
          </p>
          <p
            style={{
              margin: "0.45rem 0 0",
              fontSize: "0.68rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Świece sojowe
          </p>
        </div>
        <span
          style={{
            border: "1px solid var(--line)",
            padding: "0.45rem 0.75rem",
            fontSize: "0.65rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Płatność DEMO
        </span>
      </header>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          alignContent: "center",
          minHeight: "calc(100vh - 7rem)",
          padding: "0 clamp(1.25rem, 4vw, 3rem) 3rem",
          maxWidth: 720,
        }}
      >
        <h1
          className="anim-fade-up-delay"
          style={{
            margin: 0,
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 500,
            fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Świeca „Bursztyn”
        </h1>
        <p
          className="anim-fade-up-delay"
          style={{
            margin: "1rem 0 0",
            maxWidth: "28rem",
            color: "var(--cream)",
            fontSize: "clamp(1rem, 2.4vw, 1.2rem)",
            lineHeight: 1.55,
            opacity: 0.92,
          }}
        >
          Bursztynowy spokój w 45 godzinach światła.
        </p>
        <div
          className="anim-fade-up-delay-2"
          style={{
            marginTop: "1.35rem",
            display: "flex",
            alignItems: "baseline",
            gap: "0.85rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "1.85rem",
              color: "var(--amber-bright)",
              fontWeight: 560,
            }}
          >
            79 zł
          </span>
          <span style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
            300 ml · ~45 h palenia
          </span>
        </div>

        <BlikCheckout />
      </section>
    </main>
  );
}
