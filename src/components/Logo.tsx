import { cn } from "../lib/utils";

export function Logo({
  className,
  compact = false,
  inverted = false,
  size = 26,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
  size?: number;
}) {
  const mark = Math.round(size * 1.55);

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo-t.png"
        alt=""
        width={mark}
        height={mark}
        className={cn("shrink-0 object-contain", inverted && "brightness-0 invert")}
        style={{ width: mark, height: mark }}
      />
      {!compact && (
        <span
          className={cn(
            "truncate font-extrabold leading-none tracking-[-0.04em]",
            inverted ? "text-white" : "text-slate-900",
          )}
          style={{ fontSize: size }}
        >
          tizims
          <span className={inverted ? "text-blue-200" : "text-brand-600"}>.uz</span>
        </span>
      )}
    </span>
  );
}
