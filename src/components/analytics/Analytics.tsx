"use client";

import Script from "next/script";
import { useEffect } from "react";

const GA_ID       = process.env.NEXT_PUBLIC_GA_ID;
const PH_KEY      = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST     = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export default function Analytics() {
  useEffect(() => {
    if (!PH_KEY) return;

    import("posthog-js").then(({ default: posthog }) => {
      if (posthog.__loaded) return;
      posthog.init(PH_KEY, {
        api_host:                    PH_HOST,
        capture_pageview:            true,
        capture_pageleave:           true,
        autocapture:                 true,
        disable_session_recording:   false,
        persistence:                 "localStorage+cookie",
      });
    }).catch(() => {/* non-critical */});
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}
