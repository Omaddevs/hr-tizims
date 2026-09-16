import { cn } from "../lib/utils";

export function Logo({
  className,
  compact = false,
  inverted = false,
  size = 22,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-block truncate font-extrabold leading-none tracking-[-0.04em]",
        inverted ? "text-white" : "text-slate-900",
        className,
      )}
      style={{ fontSize: compact ? 13 : size }}
    >
      tizims
      <span className={inverted ? "text-blue-200" : "text-brand-600"}>.uz</span>
    </span>
  );
}
