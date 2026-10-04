"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

/** Kelas bersama supaya field di seluruh modul admin seragam. */
export const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export const labelClass =
  "mb-1 block font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant";

export const buttonPrimaryClass =
  "inline-flex items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60";

export const buttonGhostClass =
  "inline-flex items-center justify-center gap-space-xs rounded-lg border border-outline-variant px-space-md py-2.5 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60";

export const buttonDangerClass =
  "inline-flex items-center justify-center gap-space-xs rounded-lg bg-error px-space-md py-2.5 font-label-md text-label-md font-bold text-on-error transition-colors hover:bg-on-error-container disabled:cursor-not-allowed disabled:opacity-60";

export function Field({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

/** Dialog generik: overlay + Escape untuk menutup, dipakai form tambah/edit. */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const focusable = () => dialog?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable()?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const items = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/50 p-margin-mobile py-space-lg"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-surface-container bg-surface-container-lowest shadow-xl"
      >
        <div className="flex items-start justify-between gap-space-md border-b border-surface-container p-space-lg">
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">{title}</h2>
            {description && (
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="p-space-lg">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-space-sm border-t border-surface-container p-space-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Konfirmasi dua tombol untuk operasi destruktif (hapus). */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Hapus",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onCancel} disabled={busy}>
            Batal
          </button>
          <button type="button" className={buttonDangerClass} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-space-sm">
        <p className="font-body-sm text-body-sm text-on-surface">{description}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Tindakan ini tidak dapat dibatalkan.
        </p>
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}

/** State bersama untuk daftar: memuat, galat + tombol ulang, dan kosong. */
export function ListState({
  loading,
  error,
  empty,
  emptyLabel,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyLabel: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg font-body-sm text-body-sm text-on-surface-variant"
      >
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        Memuat data…
      </p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="space-y-space-sm rounded-2xl border border-error-container bg-error-container/40 p-space-lg"
      >
        <p className="flex items-center gap-2 font-body-sm text-body-sm font-bold text-error">
          <AlertTriangle aria-hidden className="h-4 w-4" />
          Gagal memuat data
        </p>
        <p className="font-body-sm text-body-sm text-on-surface">{error}</p>
        <button type="button" onClick={onRetry} className={buttonGhostClass}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <p className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        {emptyLabel}
      </p>
    );
  }

  return null;
}
