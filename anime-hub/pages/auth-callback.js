import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { setToken } from "../lib/anilist-auth";
import { COLORS } from "../components/UI";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Connecting to AniList...");

  useEffect(() => {
    // AniList's implicit grant puts the token in the URL fragment (#access_token=...),
    // not a query param, so we have to parse window.location.hash directly.
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (token) {
      setToken(token);
      setStatus("Connected! Redirecting...");
      setTimeout(() => router.replace("/"), 800);
    } else {
      setStatus("Something went wrong — no token received. Try connecting again from the My List tab.");
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", background: "#EAE5D6" }}>
      <p style={{ color: COLORS.ink, fontSize: 14 }}>{status}</p>
    </div>
  );
}
