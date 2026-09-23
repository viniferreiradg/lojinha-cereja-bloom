/* eslint-disable @next/next/no-img-element */
export function FotoProduto({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`grid place-items-center bg-linha/60 text-sm text-grafite ${className}`}>sem foto</div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}
