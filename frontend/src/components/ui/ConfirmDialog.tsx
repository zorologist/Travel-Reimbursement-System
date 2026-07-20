import { useEffect, useRef, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel = "Confirm", busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; if (!node) return; if (open && !node.open) node.showModal(); if (!open && node.open) node.close(); }, [open]);
  return <dialog ref={dialog} className="confirm-dialog" onCancel={(event) => { event.preventDefault(); onCancel(); }}><h2>{title}</h2><div>{children}</div><footer><button type="button" onClick={onCancel}>Cancel</button><button type="button" disabled={busy} onClick={onConfirm}>{busy ? "Working..." : confirmLabel}</button></footer></dialog>;
}
