import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/discover"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/register"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/login"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const { data: experts } = await supabaseAdmin
      .from("users")
      .select(
        "username, created_at, subscription_status, korapay_recipient_verified",
      )
      .eq("subscription_status", "active")
      .eq("korapay_recipient_verified", true);

    const publicProfiles =
      experts?.map((expert) => ({
        url: absoluteUrl(`/${expert.username}`),
        lastModified: new Date(expert.created_at),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })) ?? [];

    return [...staticRoutes, ...publicProfiles];
  } catch (error) {
    console.error("Failed to generate sitemap entries:", error);
    return staticRoutes;
  }
}
