// Shell para páginas legais (política de privacidade, termos): igual ao de
// (auth), mas sem guarda de sessão — precisa abrir tanto deslogado
// (cadastro/login) quanto logado (perfil), diferente de (app) e (run).
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-page">
      <div className="relative flex w-full max-w-[430px] flex-col bg-bg min-h-dvh">{children}</div>
    </div>
  );
}
