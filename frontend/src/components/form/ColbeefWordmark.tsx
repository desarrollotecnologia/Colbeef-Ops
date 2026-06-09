/** Logo tipográfico Colbeef — verde "Col" + rojo "beef" */
export default function ColbeefWordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <span
      className={`${sizes[size]} font-black tracking-tight select-none`}
      style={{ fontFamily: "'Arial Rounded MT Bold', 'Nunito', 'Segoe UI', sans-serif" }}
    >
      <span className="text-[#22a34a]">Col</span>
      <span className="text-[#e31e24]">beef</span>
    </span>
  );
}
