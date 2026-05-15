import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import PWARegister from "@/components/PWARegister";
import DevFooter from "@/components/DevFooter";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b0f14",
};

export const metadata: Metadata = {
  title: "1plabs Point — Team Dashboard",
  description: "Lightweight team information dashboard for 1plabs",
  appleWebApp: {
    capable: true,
    title: "Point",
    statusBarStyle: "black-translucent",
  },
};

const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('point-theme');
    if(t==='dark'){document.documentElement.setAttribute('data-theme','dark')}
    else if(t==='light'){document.documentElement.removeAttribute('data-theme')}
    else{if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.removeAttribute('data-theme')}}
  }catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background">
        <LanguageProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
            {children}
          </main>
          <DevFooter />
          <PWARegister />
        </LanguageProvider>
      </body>
    </html>
  );
}
