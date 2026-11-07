"use client";

import * as React from "react";
import { Check, FileText, ImagePlus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, NativeSelect } from "@/components/ui/input";
import { STATE_NAMES, getLgas } from "@/lib/mock-data/nigeria";

/** Downscale an image file to a compact JPEG data URL so it fits in localStorage. */
export async function fileToPreview(file: File, maxSize = 480): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function StateSelect({ value, onChange, id, placeholder = "Select state", invalid, ...rest }: { value: string; onChange: (v: string) => void; id?: string; placeholder?: string; invalid?: boolean; disabled?: boolean }) {
  return (
    <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} {...rest}>
      <option value="">{placeholder}</option>
      {STATE_NAMES.map((s) => (
        <option key={s} value={s}>
          {s === "FCT" ? "FCT (Abuja)" : s}
        </option>
      ))}
    </NativeSelect>
  );
}

/** LGA input with suggestions for the chosen state. Free text is allowed. */
export function LgaInput({ state, value, onChange, id, invalid }: { state: string; value: string; onChange: (v: string) => void; id?: string; invalid?: boolean }) {
  const listId = React.useId();
  const lgas = getLgas(state);
  return (
    <>
      <Input id={id} list={listId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={state ? "Start typing your LGA" : "Select a state first"} disabled={!state} aria-invalid={invalid} autoComplete="off" />
      <datalist id={listId}>
        {lgas.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
    </>
  );
}

export interface UploadedFile {
  fileName: string;
  previewUrl?: string;
  size: number;
}

/** Document / image upload tile with preview, used by onboarding and verification. */
export function FileUpload({
  label,
  value,
  onChange,
  accept = "image/*,.pdf",
  hint = "JPG, PNG or PDF up to 5MB",
  invalid,
  compact,
}: {
  label: string;
  value?: UploadedFile;
  onChange: (f: UploadedFile | undefined) => void;
  accept?: string;
  hint?: string;
  invalid?: boolean;
  compact?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setError(undefined);
    if (file.size > 5 * 1024 * 1024) {
      setError("File is larger than 5MB");
      return;
    }
    setBusy(true);
    try {
      const previewUrl = await fileToPreview(file);
      onChange({ fileName: file.name, previewUrl, size: file.size });
    } catch {
      setError("Could not read that file. Try another one.");
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald/40 bg-emerald-tint/40 p-3">
        {value.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.previewUrl} alt="" className="size-12 shrink-0 rounded-md object-cover ring-1 ring-line" />
        ) : (
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-navy ring-1 ring-line">
            <FileText className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{label}</p>
          <p className="truncate text-xs text-muted">
            {value.fileName} · {(value.size / 1024).toFixed(0)} KB
          </p>
        </div>
        <span className="hidden items-center gap-1 text-xs font-semibold text-emerald-deep sm:inline-flex">
          <Check className="size-3.5" /> Ready
        </span>
        <button type="button" onClick={() => onChange(undefined)} className="rounded-md p-1.5 text-muted hover:bg-white hover:text-danger" aria-label={`Remove ${label}`}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border border-dashed border-line-strong bg-white p-3 text-left transition-colors hover:border-emerald hover:bg-emerald-tint/30",
          compact ? "" : "sm:p-4",
          invalid && "border-danger",
        )}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface text-navy">{accept.startsWith("image") ? <ImagePlus className="size-5" /> : <Upload className="size-5" />}</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-ink">{busy ? "Processing…" : label}</span>
          <span className="block text-xs text-muted">{hint}</span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept={accept} className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/** Horizontal step indicator for multi-step forms. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                i < current ? "bg-emerald text-white" : i === current ? "bg-navy text-white" : "bg-line text-muted",
              )}
              aria-current={i === current ? "step" : undefined}
            >
              {i < current ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("hidden text-[13px] font-semibold lg:inline", i === current ? "text-ink" : "text-muted")}>{s}</span>
            {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full", i < current ? "bg-emerald" : "bg-line")} />}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-semibold text-muted lg:hidden">
        Step {current + 1} of {steps.length}: <span className="text-ink">{steps[current]}</span>
      </p>
    </div>
  );
}

/** Selectable chip used for multi-select options such as operating states. */
export function ChoiceChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        selected ? "border-emerald bg-emerald-tint text-emerald-deep" : "border-line bg-white text-ink-soft hover:border-line-strong",
      )}
    >
      {selected && <Check className="size-3.5" />}
      {children}
    </button>
  );
}
