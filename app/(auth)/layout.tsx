export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-page">
      <div className="relative flex w-full max-w-[430px] flex-col bg-bg min-h-dvh">{children}</div>
    </div>
  );
}
