"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/types";

export default function ProductPhotoPreview({ images, index, title, onSelect, onClose }: {
  images: ProductImage[];
  index: number;
  title: string;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photo = images[index] ?? images[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  function move(direction: number) {
    onSelect((index + direction + images.length) % images.length);
  }

  return (
    <dialog ref={dialogRef} aria-label={`${title} photo preview`} onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (images.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="fixed inset-0 m-auto h-[100dvh] max-h-none w-screen max-w-none bg-black/95 p-4 text-white backdrop:bg-black/80 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="truncate text-sm">{title}</p>
        <button autoFocus type="button" onClick={onClose} aria-label="Close photo preview" className="h-11 w-11 shrink-0 rounded-full border border-white/40 text-2xl focus-visible:outline focus-visible:outline-2">×</button>
      </div>
      {photo && <div className="pointer-events-none relative mx-auto mt-3 h-[calc(100dvh-160px)] max-w-6xl">
        <Image src={photo.url} alt={photo.altText ?? title} fill sizes="100vw" priority className="object-contain" />
      </div>}
      <div className="mt-3 flex items-center justify-center gap-6">
        {images.length > 1 && <button type="button" onClick={() => move(-1)} aria-label="Previous photo" className="rounded border border-white/40 px-4 py-2">←</button>}
        <p aria-live="polite" className="text-sm">{index + 1} / {images.length}</p>
        {images.length > 1 && <button type="button" onClick={() => move(1)} aria-label="Next photo" className="rounded border border-white/40 px-4 py-2">→</button>}
      </div>
    </dialog>
  );
}
