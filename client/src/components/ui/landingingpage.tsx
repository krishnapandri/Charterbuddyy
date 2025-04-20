"use client";

import { Button } from "@radix-ui/themes";
import { CheckIcon } from "@radix-ui/react-icons";

export default function CFALanding() {
  return (
    <div
      style={{
        backgroundColor: "#0b1d36",
        color: "white",
        padding: "2rem",
        maxWidth: "500px",
        margin: "40px auto",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", fontWeight: "bold", marginBottom: "1rem" }}>
        Struggling with Quants or Fixed Income in CFA Level 1
      </h2>

      <p style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Practice smarter with 100+ exam-style questions. Instant feedback. High-yield learning.
      </p>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Button color="green" radius="full">
          <CheckIcon /> Start Practicing for ₹59
        </Button>
      </div>

      <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>What You'll Get</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <strong>100+ Curated Questions</strong>
          <p style={{ fontSize: "0.9rem" }}>Reflect the style and difficulty of real CFA questions.</p>
        </div>
        <div>
          <strong>Test Your Prep</strong>
          <p style={{ fontSize: "0.9rem" }}>Use this to find out where you stand.</p>
        </div>
        <div>
          <strong>Explanation & Scoring</strong>
          <p style={{ fontSize: "0.9rem" }}>Simple, clear explanation for each answer.</p>
        </div>
        <div>
          <strong>Smart Structure</strong>
          <p style={{ fontSize: "0.9rem" }}>Quizzes take just 20-25 mins. Easy to fit into your day.</p>
        </div>
      </div>

      <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Launch Price: ₹199 (Lifetime Access)
      </p>

      <p style={{ textAlign: "center", marginBottom: "2rem" }}>
        No subscriptions. No ads. Just focused CFA prep.
      </p>

      <div style={{ textAlign: "center" }}>
        <Button color="green" radius="full">
          Get Instant Access
        </Button>
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          textAlign: "center",
          marginTop: "1.5rem",
          color: "#aaa",
        }}
      >
        Built by a CFA candidate, for CFA candidates.
      </p>
    </div>
  );
}
