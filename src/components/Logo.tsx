export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.03em',
        color: 'var(--text)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        <rect width="32" height="32" rx="9" fill="url(#appload-g)" />
        <path
          d="M16 8l6 10.5H10L16 8z"
          fill="#fff"
          fillOpacity="0.95"
        />
        <circle cx="16" cy="22" r="2.2" fill="#fff" />
        <defs>
          <linearGradient
            id="appload-g"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
          >
            <stop stopColor="#d8b662" />
            <stop offset="1" stopColor="#a5853a" />
          </linearGradient>
        </defs>
      </svg>
      Appload
    </span>
  );
}
