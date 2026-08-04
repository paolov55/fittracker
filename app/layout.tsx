import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ThemeSync from "@/components/ThemeSync";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import HydrationGate from "@/components/HydrationGate";
import { Toast } from "@/components/ui/overlays";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FitTracker",
  description: "Treinos, programas e progresso — para alunos e personal trainers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitTracker",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('fittracker-store');
    var theme = 'light';
    if (raw) {
      var parsed = JSON.parse(raw);
      theme = (parsed && parsed.state && parsed.state.theme) || 'light';
    }
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans antialiased bg-page text-text">
        <ThemeSync />
        <ServiceWorkerRegistrar />
        <HydrationGate>
          {children}
          <Toast />
          <InstallPrompt />
        </HydrationGate>
      </body>
    </html>
  );
}
