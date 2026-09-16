const OPEN_EVENT = "tizims-official-doc";

export type OfficialDocDetail = { title: string; inner: string };

export const DOCUMENT_STYLE = `
  @page { size: A4; margin: 16mm 18mm 16mm 18mm; }
  html, body { margin: 0; background: #fff; }
  body {
    font-family: "Times New Roman", Times, "Noto Serif", serif;
    color: #111;
    font-size: 13pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 174mm; margin: 0 auto; min-height: 250mm; }
  .center { text-align: center; }
  .blue { color: #1a3f8b; }
  .muted { color: #334155; }
  .gerb { display: block; margin: 0 auto; width: 96px; height: 96px; object-fit: contain; background: transparent; }
  .letterhead { font-family: Arial, Helvetica, sans-serif; }
  .org-line {
    color: #1a3f8b;
    font-size: 12.2pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    margin-top: 8px;
    text-transform: uppercase;
  }
  .order-line {
    color: #1a3f8b;
    font-size: 22pt;
    font-weight: 800;
    letter-spacing: 0.38em;
    margin: 6px 0 14px;
    text-transform: uppercase;
  }
  table.data { width: 100%; border-collapse: collapse; font-size: 12.5pt; }
  table.data td { border: 1px solid #222; padding: 5px 8px; vertical-align: top; }
  table.data td.k { width: 38%; background: #f8fafc; }
  ol.points { padding-left: 22px; }
  ol.points li { margin: 0 0 10px; text-align: justify; }
  .e-sign { height: 56px; max-width: 200px; object-fit: contain; }
  .e-stamp { width: 90px; height: 90px; object-fit: contain; }
  [data-sign] { min-height: 48px; }
  @media print {
    html, body { background: #fff !important; }
    .sheet { max-width: none; min-height: 0; }
  }
`;

export function wrapOfficialHtml(title: string, inner: string, autoPrint = false) {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>${DOCUMENT_STYLE}</style>
</head>
<body>
  <div class="sheet">${inner}</div>
  ${autoPrint ? `<script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>` : ""}
</body>
</html>`;
}

export function printHtml(title: string, inner: string) {
  window.dispatchEvent(new CustomEvent<OfficialDocDetail>(OPEN_EVENT, { detail: { title, inner } }));
  return true;
}

export function subscribeOfficialDoc(handler: (doc: OfficialDocDetail) => void) {
  const on = (e: Event) => handler((e as CustomEvent<OfficialDocDetail>).detail);
  window.addEventListener(OPEN_EVENT, on);
  return () => window.removeEventListener(OPEN_EVENT, on);
}

export function printIframeWindow(frame: HTMLIFrameElement | null) {
  const w = frame?.contentWindow;
  if (!w) return false;
  w.focus();
  w.print();
  return true;
}

export function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fileStem(title: string) {
  return title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "buyruq";
}
