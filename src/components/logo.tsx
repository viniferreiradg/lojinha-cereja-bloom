/* eslint-disable @next/next/no-img-element */
// Logo para fundo claro, servido pelo próprio site da banda
export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <img
      src="https://www.cerejabloom.com.br/svg/logo-horizontal-fundo-claro.svg"
      alt="Cereja Bloom"
      className={`${className} w-auto`}
    />
  );
}
