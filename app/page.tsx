"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useState } from "react";

type Result = { url: string; expiresAt: string; files: number };

const PRESETS = [3, 7];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const busy = status !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      setStatus("Se încarcă ZIP-ul…");
      const blob = await uploadPresigned(`uploads/${Date.now()}.zip`, file, {
        access: "private",
        handleUploadUrl: "/api/upload-token",
        onUploadProgress: ({ percentage }) => setStatus(`Se încarcă ZIP-ul… ${Math.round(percentage)}%`),
      });
      setStatus("Se publică site-ul…");
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ zipUrl: blob.url, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStatus(null);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
  }

  return (
    <main>
      <h1>Limited Links</h1>
      <p className="sub">Încarci un ZIP cu site-ul, primești un link care expiră singur.</p>

      <form onSubmit={submit} className="card">
        <label className="drop">
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
          <span>{file ? file.name : "Alege fișierul .zip (trebuie să conțină index.html)"}</span>
        </label>

        <div>
          <span className="lbl">Expiră după</span>
          <div className="days">
            {PRESETS.map((p) => (
              <button type="button" key={p} className={days === p ? "on" : ""} onClick={() => setDays(p)}>
                {p} zile
              </button>
            ))}
            <label className="custom">
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
              />
              zile
            </label>
          </div>
        </div>

        <button type="submit" className="primary" disabled={busy || !file}>
          {status ?? "Generează link"}
        </button>

        {error && <p className="err">{error}</p>}
      </form>

      {result && (
        <div className="card result">
          <div className="link">
            <a href={result.url} target="_blank" rel="noreferrer">
              {result.url}
            </a>
            <button type="button" onClick={copy}>
              {copied ? "Copiat" : "Copiază"}
            </button>
          </div>
          <p className="sub">
            Expiră pe {new Date(result.expiresAt).toLocaleString("ro-RO")} · {result.files} fișiere
          </p>
        </div>
      )}
    </main>
  );
}
