export default function BrandMark({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="14" height="14" rx="3.5" stroke="currentColor" />
      <path d="M4 8.6V5.2L7.5 3.5L11 5.2V8.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 8.2V11.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
