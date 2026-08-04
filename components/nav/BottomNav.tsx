"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, DumbbellIcon, UsersIcon, LineChartIcon, UserIcon } from "@/components/icons";

interface NavItem {
  href: string;
  match: (path: string) => boolean;
  icon: (size: number) => React.ReactNode;
  label: string;
}

const ITEMS: Record<"student" | "trainer", NavItem[]> = {
  student: [
    { href: "/inicio", match: (p) => p === "/inicio", icon: (s) => <HomeIcon size={s} />, label: "Início" },
    {
      href: "/programas",
      match: (p) => p.startsWith("/programas"),
      icon: (s) => <DumbbellIcon size={s} />,
      label: "Programas",
    },
    {
      href: "/historico",
      match: (p) => p.startsWith("/historico"),
      icon: (s) => <LineChartIcon size={s} />,
      label: "Histórico",
    },
    { href: "/perfil", match: (p) => p.startsWith("/perfil"), icon: (s) => <UserIcon size={s} />, label: "Perfil" },
  ],
  trainer: [
    { href: "/inicio", match: (p) => p === "/inicio", icon: (s) => <HomeIcon size={s} />, label: "Início" },
    {
      href: "/programas",
      match: (p) => p.startsWith("/programas"),
      icon: (s) => <DumbbellIcon size={s} />,
      label: "Programas",
    },
    {
      href: "/alunos",
      match: (p) => p.startsWith("/alunos"),
      icon: (s) => <UsersIcon size={s} />,
      label: "Alunos",
    },
    {
      href: "/historico",
      match: (p) => p.startsWith("/historico"),
      icon: (s) => <LineChartIcon size={s} />,
      label: "Histórico",
    },
    { href: "/perfil", match: (p) => p.startsWith("/perfil"), icon: (s) => <UserIcon size={s} />, label: "Perfil" },
  ],
};

export default function BottomNav({ role }: { role: "student" | "trainer" }) {
  const pathname = usePathname();
  const items = ITEMS[role];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[26px] z-50 flex justify-center">
      <nav
        className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-ink p-[7px] shadow-[0_14px_34px_rgba(0,0,0,.26)]"
        aria-label="Navegação principal"
      >
        {items.map((item) => {
          const active = item.match(pathname ?? "");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors"
              style={{
                background: active ? "#fafafa" : "transparent",
                color: active ? "#18181b" : "rgba(250,250,250,.55)",
              }}
            >
              {item.icon(21)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
