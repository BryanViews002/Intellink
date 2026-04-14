import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/seo";
import { CustomCursor } from "@/components/motion/CustomCursor";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | ${siteConfig.title}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  category: "business",
  creator: siteConfig.name,
  publisher: siteConfig.name,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.title}`,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.title}`,
    description: siteConfig.description,
    images: [absoluteUrl("/twitter-image")],
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon"),
    description: siteConfig.description,
    sameAs: [],
  };

  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-[100dvh] flex-col overflow-x-hidden`}>
        <CustomCursor />
        <div className="flex-1">{children}</div>

        {/* ── Site Footer ───────────────────────────────────── */}
        <footer className="site-footer">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              {/* Brand */}
              <div>
                <Link
                  href="/"
                  className="text-base font-bold tracking-tight text-white hover:text-amber-300 transition-colors"
                >
                  Intellink
                </Link>
                <p className="mt-1 text-xs text-slate-400">
                  Get paid for what you know.
                </p>
              </div>

              {/* Nav links */}
              <nav aria-label="Footer navigation">
                <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
                  {[
                    { href: "/discover", label: "Discover experts" },
                    { href: "/register", label: "Become an expert" },
                    { href: "/login", label: "Sign in" },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Divider */}
            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Intellink. All rights reserved.
            </div>
          </div>
        </footer>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
