import { useRef, useState } from "react";
import { ImageOff, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUploadSignature } from "@/functions/admin/uploads";
import { optimizedImage } from "@/lib/images";

export type ImageValue = { url: string | null; publicId: string | null };

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Carpeta = "platillos" | "promociones" | "empresa";

/** Sube una imagen directo a Cloudinary con una firma del servidor. */
function useUpload(carpeta: Carpeta, onDone: (value: ImageValue) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError("Usa una imagen JPG, PNG, WebP o AVIF.");
    if (file.size > MAX_BYTES) return setError("La imagen no debe pesar más de 5 MB.");

    setUploading(true);
    try {
      const sig = await getUploadSignature({ data: { carpeta } });
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json.secure_url || !json.public_id) {
        throw new Error(json.error?.message ?? "No se pudo subir la imagen.");
      }
      onDone({ url: json.secure_url, publicId: json.public_id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED.join(",")}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void upload(file);
      }}
    />
  );
  return { inputRef, uploading, error, fileInput };
}

export function ImageField({
  value,
  onChange,
  carpeta,
  cloudinary,
  label = "Foto",
}: {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  carpeta: Carpeta;
  cloudinary: boolean;
  label?: string;
}) {
  const { inputRef, uploading, error, fileInput } = useUpload(carpeta, onChange);
  const preview = optimizedImage(value.url, 400);

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {cloudinary && (
            <>
              {fileInput}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                {uploading ? "Subiendo…" : value.url ? "Cambiar foto" : "Subir foto"}
              </Button>
            </>
          )}
          {value.url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ url: null, publicId: null })}
            >
              <X /> Quitar
            </Button>
          )}
        </div>
      </div>
      {!cloudinary && (
        <>
          <Input
            placeholder="https://… o /images/…"
            value={value.url ?? ""}
            onChange={(e) => onChange({ url: e.target.value || null, publicId: null })}
          />
          <p className="text-xs text-muted-foreground">
            La subida de fotos aún no está configurada: por ahora puedes pegar la dirección (URL) de
            la imagen.
          </p>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Fotos adicionales (galería del detalle del plato). */
export function GalleryField({
  value,
  onChange,
  carpeta,
  cloudinary,
  max = 6,
}: {
  value: { url: string; public_id: string | null }[];
  onChange: (value: { url: string; public_id: string | null }[]) => void;
  carpeta: Carpeta;
  cloudinary: boolean;
  max?: number;
}) {
  const [manual, setManual] = useState("");
  const { inputRef, uploading, error, fileInput } = useUpload(carpeta, (img) => {
    if (img.url) onChange([...value, { url: img.url, public_id: img.publicId }]);
  });
  const quitar = (i: number) => onChange(value.filter((_, k) => k !== i));
  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {value.map((g, i) => (
          <div
            key={g.url + i}
            className="group relative size-20 overflow-hidden rounded-md border bg-muted"
          >
            <img
              src={optimizedImage(g.url, 200)}
              alt={`Foto adicional ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                className="px-1.5 py-0.5 text-xs text-white disabled:opacity-40"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                aria-label="Mover a la izquierda"
              >
                ◀
              </button>
              <button
                type="button"
                className="px-1.5 py-0.5 text-xs text-white"
                onClick={() => quitar(i)}
                aria-label={`Quitar foto ${i + 1}`}
              >
                <X className="size-3.5" />
              </button>
              <button
                type="button"
                className="px-1.5 py-0.5 text-xs text-white disabled:opacity-40"
                onClick={() => mover(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Mover a la derecha"
              >
                ▶
              </button>
            </div>
          </div>
        ))}
        {value.length < max && cloudinary && (
          <>
            {fileInput}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="grid size-20 place-items-center rounded-md border border-dashed text-muted-foreground hover:border-brand-wine hover:text-brand-wine"
              aria-label="Agregar foto"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
            </button>
          </>
        )}
      </div>
      {value.length < max && !cloudinary && (
        <div className="flex gap-2">
          <Input
            placeholder="https://… o /images/…"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = manual.trim();
              if (url.startsWith("/") || url.startsWith("https://")) {
                onChange([...value, { url, public_id: null }]);
                setManual("");
              }
            }}
          >
            Agregar
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
