import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/shared/config/app";
const isProduction = process.env.NODE_ENV === "production";
const isMaintenanceMode = process.env.SITE_MAINTENANCE_MODE === "true" && isProduction;
export default function robots(): MetadataRoute.Robots {
  return { rules: isMaintenanceMode ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/" }, sitemap: SITE_BASE_URL + "/sitemap.xml", host: SITE_BASE_URL };
}
