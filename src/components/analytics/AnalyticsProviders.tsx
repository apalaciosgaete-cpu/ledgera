// src/components/analytics/AnalyticsProviders.tsx
"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ConsentState = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const STORAGE_KEY = "ledgera-cookie-consent";
const CONSENT_EVENT = "ledgera-cookie-consent-updated";

function readAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const parsed = JSON.parse(stored) as Partial<ConsentState>;
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export default function AnalyticsProviders() {
  const pathname = usePathname();
  const firstGaPath = useRef<string | null>(null);
  const posthogInitialized = useRef(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const gaMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  useEffect(() => {
    function refreshConsent() {
      setAnalyticsEnabled(readAnalyticsConsent());
    }

    refreshConsent();

    window.addEventListener("storage", refreshConsent);
    window.addEventListener(CONSENT_EVENT, refreshConsent as EventListener);

    return () => {
      window.removeEventListener("storage", refreshConsent);
      window.removeEventListener(CONSENT_EVENT, refreshConsent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!analyticsEnabled || !gaMeasurementId || !window.gtag) return;

    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (firstGaPath.current === null) {
      firstGaPath.current = currentPath;
      return;
    }

    window.gtag("config", gaMeasurementId, {
      page_path: currentPath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analyticsEnabled, gaMeasurementId, pathname]);

  useEffect(() => {
    if (!analyticsEnabled || !posthogKey) return;

    let cancelled = false;

    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;

      if (!posthogInitialized.current) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          capture_pageview: false,
          person_profiles: "identified_only",
        });
        posthogInitialized.current = true;
      }

      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [analyticsEnabled, pathname, posthogHost, posthogKey]);

  if (!analyticsEnabled) return null;

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />

      {gaMeasurementId ? (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname + window.location.search,
                  page_location: window.location.href,
                  page_title: document.title
                });
              `,
            }}
          />
        </>
      ) : null}
    </>
  );
}
