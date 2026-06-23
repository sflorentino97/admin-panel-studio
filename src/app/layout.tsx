import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const helvetica = localFont({
  src: [
    { path: "../../fonts/HelveticaNeueLTProLt.otf", weight: "300", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProLtIt.otf", weight: "300", style: "italic" },
    { path: "../../fonts/HelveticaNeueLTProRoman.otf", weight: "400", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProIt.otf", weight: "400", style: "italic" },
    { path: "../../fonts/HelveticaNeueLTProMd.otf", weight: "500", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProMdIt.otf", weight: "500", style: "italic" },
    { path: "../../fonts/HelveticaNeueLTProBd.otf", weight: "700", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProBdIt.otf", weight: "700", style: "italic" },
    { path: "../../fonts/HelveticaNeueLTProHv.otf", weight: "800", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProHvIt.otf", weight: "800", style: "italic" },
    { path: "../../fonts/HelveticaNeueLTProBlk.otf", weight: "900", style: "normal" },
    { path: "../../fonts/HelveticaNeueLTProBlkIt.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-helvetica",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Florentino — Portal de Clientes",
  description: "Portal de gerenciamento de demandas",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo-icon.svg", type: "image/svg+xml" }],
    apple: "/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Florentino",
  },
};

export const viewport: Viewport = {
  themeColor: "#9B29FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head />
      <body className={`${helvetica.variable} font-sans antialiased`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
