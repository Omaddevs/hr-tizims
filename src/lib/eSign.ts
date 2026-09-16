const KEY = "tizims-e-sign-v1";

export type SignStore = {
  rector?: string;
  stamp?: string;
};

export function loadSigns(): SignStore {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as SignStore;
  } catch {
    return {};
  }
}

export function saveSigns(next: SignStore) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function insertIntoSlot(doc: Document, slot: "rector" | "stamp", dataUrl: string) {
  const cell = doc.querySelector(`[data-sign="${slot}"]`);
  const img = doc.createElement("img");
  img.src = dataUrl;
  img.alt = slot === "stamp" ? "Muhr" : "Elektron imzo";
  img.className = slot === "stamp" ? "e-stamp" : "e-sign";
  if (cell) {
    cell.innerHTML = "";
    cell.appendChild(img);
    return;
  }
  const sel = doc.getSelection();
  if (sel && sel.rangeCount) {
    sel.getRangeAt(0).insertNode(img);
  }
}

export function applySavedSigns(doc: Document) {
  const stored = loadSigns();
  if (stored.rector) insertIntoSlot(doc, "rector", stored.rector);
  if (stored.stamp) insertIntoSlot(doc, "stamp", stored.stamp);
}

export function stampSvgDataUrl() {
  const gerb = typeof window !== "undefined" ? `${window.location.origin}/gerb.png?v=2` : "/gerb.png";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="66" fill="#fff" stroke="#1a3f8b" stroke-width="3.5"/>
    <circle cx="70" cy="70" r="58" fill="none" stroke="#1a3f8b" stroke-width="1.2"/>
    <path id="r" fill="none" d="M70,70 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0"/>
    <text fill="#1a3f8b" font-size="8.2" font-family="Arial, sans-serif" font-weight="700" letter-spacing="1.4">
      <textPath href="#r" xlink:href="#r">XALQARO QISHLOQ XO'JALIGI UNIVERSITETI · IAU · </textPath>
    </text>
    <image href="${gerb}" xlink:href="${gerb}" x="43" y="40" width="54" height="54"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
