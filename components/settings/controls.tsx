import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Kartu baris setting: label + deskripsi opsional di kiri, kontrol di kanan atau di bawah. */
export function SettingRow({ label, hint, children, stacked }: { label: string; hint?: string; children?: ReactNode; stacked?: boolean }) {
  return (
    <div className={cn("rounded-lf-md bg-lf-bg/60 px-4 py-3", stacked ? "flex flex-col gap-3" : "flex items-center justify-between gap-4")}>
      {(label || hint) && (
        <div className="min-w-0">
          <div className="font-game-body text-lf-body text-lf-text">{label}</div>
          {hint && <p className="mt-1 text-lf-caption leading-relaxed text-lf-text-muted">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Pilihan satu-dari-banyak berupa deretan pil. */
export function OptionPills<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "cursor-pointer rounded-lf-sm border px-3 py-1.5 font-game-mono text-lf-caption font-bold transition-colors",
            value === o.value
              ? "border-lf-accent bg-lf-accent/15 text-lf-accent"
              : "border-lf-border bg-lf-surface text-lf-text-muted hover:bg-lf-surface-hover hover:text-lf-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const ACTION_VARIANTS = {
  primary: "bg-lf-primary hover:bg-lf-primary-hover text-white",
  danger: "bg-lf-danger/20 text-lf-danger hover:bg-lf-danger/30 border border-lf-danger/50",
} as const;

/** Tombol aksi penuh lebar. */
export function ActionButton({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof ACTION_VARIANTS }) {
  return (
    <button
      type="button"
      {...props}
      className={cn("w-full cursor-pointer rounded-lf-md px-4 py-3 font-game-body text-lf-body font-bold transition-colors", ACTION_VARIANTS[variant], className)}
    />
  );
}
