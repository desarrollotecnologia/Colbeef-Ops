/** Logo tipográfico Colbeef — verde "Col" + rojo "beef" */
export default function ColbeefWordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className="bg-white inline-flex items-center justify-center">
      <img
        src="/colbeef-wordmark.png"
        alt="Colbeef"
        className={`${heights[size]} w-auto object-contain`}
      />
    </div>
  );
}
