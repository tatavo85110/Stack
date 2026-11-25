export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Stack">
      <rect width="64" height="64" rx="16" fill="#0b1f3a" />
      <rect x="12" y="15" width="28" height="9" rx="4.5" fill="#ffffff" />
      <rect x="24" y="27.5" width="28" height="9" rx="4.5" fill="#8cc4f2" />
      <rect x="12" y="40" width="40" height="9" rx="4.5" fill="#2f7fd0" />
    </svg>
  );
}
