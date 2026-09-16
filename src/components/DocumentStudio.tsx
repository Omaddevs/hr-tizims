import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  PenLine,
  Printer,
  Redo2,
  Stamp,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "./ui";
import { applySavedSigns, insertIntoSlot, loadSigns, saveSigns, stampSvgDataUrl } from "../lib/eSign";
import {
  downloadHtmlFile,
  fileStem,
  printIframeWindow,
  subscribeOfficialDoc,
  wrapOfficialHtml,
  type OfficialDocDetail,
} from "../lib/printDoc";

const FONTS = ["Times New Roman", "Arial", "Calibri", "Georgia", "Cambria", "Tahoma", "Courier New"];
const SIZES = ["10pt", "11pt", "12pt", "13pt", "14pt", "16pt", "18pt", "20pt", "22pt", "24pt", "28pt"];
const COLORS = ["#111111", "#1a3f8b", "#1d4ed8", "#b91c1c", "#166534", "#7c3aed", "#c2410c"];

function Tool({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm ${
        active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function editorDoc(frame: HTMLIFrameElement | null) {
  return frame?.contentDocument ?? null;
}

function cmd(frame: HTMLIFrameElement | null, command: string, value?: string) {
  const doc = editorDoc(frame);
  if (!doc) return;
  doc.designMode = "on";
  doc.execCommand(command, false, value);
  frame?.contentWindow?.focus();
}

function applyCss(frame: HTMLIFrameElement | null, style: Record<string, string>) {
  const doc = editorDoc(frame);
  if (!doc) return;
  const sel = doc.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) return;
  const range = sel.getRangeAt(0);
  const span = doc.createElement("span");
  Object.assign(span.style, style);
  try {
    range.surroundContents(span);
  } catch {
    span.appendChild(range.extractContents());
    range.insertNode(span);
  }
  frame?.contentWindow?.focus();
}

export function DocumentStudio() {
  const [doc, setDoc] = useState<OfficialDocDetail | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [printHint, setPrintHint] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => subscribeOfficialDoc(setDoc), []);

  useEffect(() => {
    if (!doc) return;
    const iframe = frameRef.current;
    if (!iframe) return;
    const idoc = iframe.contentDocument;
    if (!idoc) return;
    idoc.open();
    idoc.write(wrapOfficialHtml(doc.title, doc.inner));
    idoc.close();
    const enable = () => {
      const live = iframe.contentDocument;
      if (!live) return;
      live.designMode = "on";
      applySavedSigns(live);
      iframe.contentWindow?.focus();
    };
    requestAnimationFrame(enable);
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !signOpen && !printHint) setDoc(null);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPrintHint(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, signOpen, printHint]);

  if (!doc) return null;
  const current = doc;

  function currentHtml() {
    const inner = editorDoc(frameRef.current)?.querySelector(".sheet")?.innerHTML
      ?? editorDoc(frameRef.current)?.body.innerHTML
      ?? current.inner;
    return wrapOfficialHtml(current.title, inner);
  }

  function printNow() {
    setPrintHint(false);
    printIframeWindow(frameRef.current);
  }

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-800/70">
      <div className="flex h-full flex-col bg-slate-100">
        <div className="border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">{doc.title}</div>
              <div className="text-[11px] text-slate-500">Word kabi tahrirlang · Ctrl+B / I / U · Chop etishda printer tanlanadi</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setSignOpen(true)}>
                <PenLine className="h-4 w-4" /> Elektron imzo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const stamp = stampSvgDataUrl();
                  saveSigns({ ...loadSigns(), stamp });
                  const idoc = editorDoc(frameRef.current);
                  if (idoc) insertIntoSlot(idoc, "stamp", stamp);
                }}
              >
                <Stamp className="h-4 w-4" /> Muhr
              </Button>
              <Button size="sm" onClick={() => setPrintHint(true)}>
                <Printer className="h-4 w-4" /> Chop etish / PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadHtmlFile(fileStem(doc.title), currentHtml())}
              >
                Yuklab olish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDoc(null)}>Yopish</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 p-1.5">
            <select
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
              defaultValue="Times New Roman"
              onMouseDown={(e) => e.preventDefault()}
              onChange={(e) => cmd(frameRef.current, "fontName", e.target.value)}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <select
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
              defaultValue="13pt"
              onMouseDown={(e) => e.preventDefault()}
              onChange={(e) => applyCss(frameRef.current, { fontSize: e.target.value })}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <Tool title="Qalin (Ctrl+B)" onClick={() => cmd(frameRef.current, "bold")}><Bold className="h-4 w-4" /></Tool>
            <Tool title="Kursiv (Ctrl+I)" onClick={() => cmd(frameRef.current, "italic")}><Italic className="h-4 w-4" /></Tool>
            <Tool title="Tagiga chizish (Ctrl+U)" onClick={() => cmd(frameRef.current, "underline")}><Underline className="h-4 w-4" /></Tool>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => cmd(frameRef.current, "foreColor", c)}
                className="h-5 w-5 rounded-full border border-slate-200"
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              title="Boshqa rang"
              className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white"
              onMouseDown={(e) => e.preventDefault()}
              onChange={(e) => cmd(frameRef.current, "foreColor", e.target.value)}
            />
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <Tool title="Chap" onClick={() => cmd(frameRef.current, "justifyLeft")}><AlignLeft className="h-4 w-4" /></Tool>
            <Tool title="Markaz" onClick={() => cmd(frameRef.current, "justifyCenter")}><AlignCenter className="h-4 w-4" /></Tool>
            <Tool title="O'ng" onClick={() => cmd(frameRef.current, "justifyRight")}><AlignRight className="h-4 w-4" /></Tool>
            <Tool title="Tekislash" onClick={() => cmd(frameRef.current, "justifyFull")}><AlignJustify className="h-4 w-4" /></Tool>
            <Tool title="Raqamli ro'yxat" onClick={() => cmd(frameRef.current, "insertOrderedList")}><ListOrdered className="h-4 w-4" /></Tool>
            <Tool title="Marker" onClick={() => cmd(frameRef.current, "insertUnorderedList")}><List className="h-4 w-4" /></Tool>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <Tool title="Bekor qilish" onClick={() => cmd(frameRef.current, "undo")}><Undo2 className="h-4 w-4" /></Tool>
            <Tool title="Qaytarish" onClick={() => cmd(frameRef.current, "redo")}><Redo2 className="h-4 w-4" /></Tool>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-4">
          <iframe
            ref={frameRef}
            title={doc.title}
            className="mx-auto block h-[297mm] w-[210mm] max-w-full bg-white shadow-xl"
          />
        </div>
      </div>

      {printHint && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setPrintHint(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-nav" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Chop etish</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tizim chop etish oynasi ochiladi. U yerda <b>barcha ulangan printerlar</b> ko‘rinadi: HP, Canon, PDF, va boshqalar.
              Keraklisini tanlang, nusxalar sonini belgilang va Chop etishni bosing.
            </p>
            <p className="mt-2 text-xs text-slate-500">PDF kerak bo‘lsa: printer sifatida «Save as PDF» / «Microsoft Print to PDF».</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPrintHint(false)}>Bekor</Button>
              <Button onClick={printNow}>Printerni tanlash</Button>
            </div>
          </div>
        </div>
      )}

      {signOpen && (
        <SignatureDialog
          onClose={() => setSignOpen(false)}
          onApply={(dataUrl) => {
            saveSigns({ ...loadSigns(), rector: dataUrl });
            const idoc = editorDoc(frameRef.current);
            if (idoc) insertIntoSlot(idoc, "rector", dataUrl);
            setSignOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SignatureDialog({ onClose, onApply }: { onClose: () => void; onApply: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const saved = loadSigns().rector;
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = saved;
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  }

  function clear() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
  }

  function apply() {
    const c = canvasRef.current;
    if (!c) return;
    onApply(c.toDataURL("image/png"));
  }

  function upload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-nav" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold">Elektron imzo</h3>
        <p className="mt-1 text-sm text-slate-500">Sichqoncha yoki barmoq bilan imzo chizing, yoki rasm yuklang. Imzo Rektor qatoriga tushadi va saqlanadi.</p>
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          className="mt-3 w-full cursor-crosshair rounded-xl border border-slate-200 bg-white touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => { drawing.current = false; }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="cursor-pointer text-sm font-medium text-brand-700">
            Rasm yuklash
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clear}>Tozalash</Button>
            <Button variant="ghost" onClick={onClose}>Bekor</Button>
            <Button onClick={apply}>Imzoni qo'yish</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
