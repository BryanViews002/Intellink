import type { Metadata } from "next";

const DEFAULT_BASE_URL = "http://localhost:3000";

export const siteConfig = {
  name: "Intellink",
  shortName: "Intellink",
  title: "Get paid for what you know",
  description:
    "Intellink is a premium SaaS platform where experts sell paid Q&A, sessions, and digital resources with subscription-first access and instant payouts.",
  keywords: [
    "Intellink",
    "expert platform",
    "knowledge monetization",
    "sell consultations online",
    "paid Q&A platform",
    "book paid sessions",
    "sell digital resources",
    "expert subscriptions",
    "creator SaaS",
    "professional services platform",
  ],
};

function normalizeBaseUrl(input?: string) {
  if (!input) {
    return DEFAULT_BASE_URL;
  }

  const trimmed = input.trim();

  if (!trimmed) {
    return DEFAULT_BASE_URL;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    return new URL(`https://${trimmed}`).toString().replace(/\/$/, "");
  }
}

export function getSiteUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function truncateDescription(
  value: string | null | undefined,
  fallback = siteConfig.description,
  maxLength = 160,
) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  const source = normalized || fallback;

  if (source.length <= maxLength) {
    return source;
  }

  return `${source.slice(0, maxLength - 1).trim()}...`;
}

type BuildMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  imagePath?: string;
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  imagePath = "/opengraph-image",
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    keywords: siteConfig.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
