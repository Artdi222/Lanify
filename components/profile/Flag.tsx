import "flag-icons/css/flag-icons.min.css";

/** Country flag (SVG via flag-icons). `height` in px; the 4:3 box follows. */
export default function Flag({ code, height = 20 }: { code: string; height?: number }) {
  return <span className={`fi fi-${code.toLowerCase()} rounded-[2px]`} style={{ width: (height * 4) / 3, height }} role="img" aria-label={code} />;
}
