// Forces a true download (Content-Disposition style) even when the file
// is on a different origin (e.g. Cloudflare R2 public bucket) where the
// HTML `download` attribute is silently ignored by browsers.
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "ficheiro";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Fallback: open in new tab if CORS blocks the fetch
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "ficheiro";
    a.rel = "noreferrer";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
