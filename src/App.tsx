import type React from "react";

import { useMemo, useState } from "react";
import { makeImageGridPdf } from "./pdf/makeImageGridPdf";
import type { PdfGridOptions } from "./pdf/makeImageGridPdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImageIcon,
  DownloadIcon,
  SettingsIcon,
  FileTextIcon,
} from "lucide-react";

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
    boxWidthCm: 8,
    boxHeightCm: 8,
    gapCm: 0.5,
    marginCm: 1.5,
    fitMode: "contain",
  });

  const previews = useMemo(() => {
    return files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
  }, [files]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
            <FileTextIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
            Image Grid PDF Generator
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Upload PNG or JPG images and arrange them into a consistent grid
            layout for printing. Configure your settings and export as a
            professional PDF document.
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="mb-8 border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-card-foreground">
              Configuration
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* File Upload */}
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Label
                htmlFor="file-upload"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Upload Images
              </Label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg"
                  onChange={onPick}
                  className="h-auto py-2 cursor-pointer file:mr-4 file:cursor-pointer leading-normal file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            {/* Page Format */}
            <div>
              <Label
                htmlFor="page-format"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Page Format
              </Label>
              <Select
                value={opts.pageFormat}
                onValueChange={(value) =>
                  setOpts((o) => ({ ...o, pageFormat: value as any }))
                }
              >
                <SelectTrigger id="page-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="LETTER">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div>
              <Label
                htmlFor="orientation"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Orientation
              </Label>
              <Select
                value={opts.orientation}
                onValueChange={(value) =>
                  setOpts((o) => ({ ...o, orientation: value as any }))
                }
              >
                <SelectTrigger id="orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photo Width */}
            <div>
              <Label
                htmlFor="photo-width"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Photo Width (cm)
              </Label>
              <Input
                id="photo-width"
                type="number"
                step={0.1}
                value={opts.boxWidthCm}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, boxWidthCm: Number(e.target.value) }))
                }
              />
            </div>

            {/* Photo Height */}
            <div>
              <Label
                htmlFor="photo-height"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Photo Height (cm)
              </Label>
              <Input
                id="photo-height"
                type="number"
                step={0.1}
                value={opts.boxHeightCm}
                onChange={(e) =>
                  setOpts((o) => ({
                    ...o,
                    boxHeightCm: Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Fit Mode */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Label
                htmlFor="fit-mode"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Fit Mode
              </Label>
              <Select
                value={opts.fitMode}
                onValueChange={(value) =>
                  setOpts((o) => ({ ...o, fitMode: value as any }))
                }
              >
                <SelectTrigger id="fit-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Contain (no crop)</SelectItem>
                  <SelectItem value="cover">Cover (crop)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onDownload}
              disabled={!files.length || busy}
              size="lg"
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {busy ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </Card>

        {/* Preview Section */}
        <Card className="border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-card-foreground">
                Image Preview
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {files.length} {files.length === 1 ? "image" : "images"}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-1 text-base font-medium text-foreground">
                No images uploaded yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload PNG or JPG files to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {previews.map((p) => (
                <div
                  key={p.file.name + p.file.size}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden bg-muted/30 p-3">
                    <img
                      src={p.url || "/placeholder.svg"}
                      alt={p.file.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="border-t border-border bg-card p-3">
                    <p className="truncate text-xs font-medium text-card-foreground">
                      {p.file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
