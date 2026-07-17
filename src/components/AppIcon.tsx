export default function AppIcon({
  icon,
  bg,
  size = 60,
  radius,
}: {
  icon: string;
  bg: string;
  size?: number;
  radius?: number;
}) {
  const r = radius ?? Math.round(size * 0.26);
  const isImage = typeof icon === 'string' && icon.startsWith('data:');

  if (isImage) {
    return (
      <img
        src={icon}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: r,
          objectFit: 'cover',
          display: 'block',
          boxShadow: '0 4px 12px rgba(28,27,24,0.14)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: bg || '#c6a24c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
        boxShadow: '0 4px 12px rgba(28,27,24,0.14)',
        userSelect: 'none',
      }}
    >
      {icon || '📱'}
    </div>
  );
}
