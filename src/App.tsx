import { useMemo, useState } from "react";
import { makeImageGridPdf } from "./pdf/makeImageGridPdf";
import type { PdfGridOptions } from "./pdf/makeImageGridPdf";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const [opts, setOpts] = useState<PdfGridOptions>({
    pageFormat: "A4",
    orientation: "portrait",
    cols: 2,
    rows: 4,
    gapPt: 12, // 12pt ~ 4.2mm
    marginPt: 36, // 36pt ~ 12.7mm
    fitMode: "contain",
  });

  const previews = useMemo(() => {
    return files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    // NOTE: we revoke below in effect cleanup
  }, [files]);

  // cleanup preview URLs
  // (simple approach: revoke on next change/unmount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    // keep only png/jpg
    const filtered = list.filter((f) => /\.(png|jpe?g)$/i.test(f.name));
    setFiles(filtered);
  }

  async function onDownload() {
    if (!files.length) return;
    setBusy(true);
    try {
      const pdf = await makeImageGridPdf(files, opts);
      downloadBlob(pdf, "images-grid.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ margin: 0 }}>Image Grid → Printable PDF</h1>
      <p style={{ opacity: 0.8 }}>
        Upload PNG/JPG files. They’ll be placed into a consistent grid and
        exported as a PDF.
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Images</div>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg"
            onChange={onPick}
          />
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Page</div>
          <select
            value={opts.pageFormat}
            onChange={(e) =>
              setOpts((o) => ({ ...o, pageFormat: e.target.value as any }))
            }
          >
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Orientation</div>
          <select
            value={opts.orientation}
            onChange={(e) =>
              setOpts((o) => ({ ...o, orientation: e.target.value as any }))
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Columns</div>
          <input
            type="number"
            min={1}
            max={6}
            value={opts.cols}
            onChange={(e) =>
              setOpts((o) => ({ ...o, cols: Number(e.target.value) }))
            }
            style={{ width: 70 }}
          />
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Rows</div>
          <input
            type="number"
            min={1}
            max={10}
            value={opts.rows}
            onChange={(e) =>
              setOpts((o) => ({ ...o, rows: Number(e.target.value) }))
            }
            style={{ width: 70 }}
          />
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Fit</div>
          <select
            value={opts.fitMode}
            onChange={(e) =>
              setOpts((o) => ({ ...o, fitMode: e.target.value as any }))
            }
          >
            <option value="contain">Contain (no crop)</option>
            <option value="cover">Cover (crop)</option>
          </select>
        </label>

        <button
          onClick={onDownload}
          disabled={!files.length || busy}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: !files.length || busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          Preview ({files.length} images)
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {previews.map((p) => (
            <div
              key={p.file.name + p.file.size}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <img
                src={p.url}
                alt={p.file.name}
                style={{
                  width: "100%",
                  height: 110,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <div
                style={{ fontSize: 12, marginTop: 6, wordBreak: "break-word" }}
              >
                {p.file.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
