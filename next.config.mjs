const isMaintenanceMode = false;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://us.i.posthog.com https://eu.i.posthog.com https://app.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https: https://www.google-analytics.com https://analytics.google.com https://us.i.posthog.com https://eu.i.posthog.com https://app.posthog.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const noIndexHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
  },
];

const publicMaintenanceRoutes = [
  "/",
  "/como-funciona",
  "/planes",
  "/impuestos-crypto-chile",
  "/como-declarar-crypto-en-chile",
  "/conciliacion-binance-banco",
  "/contador-crypto-chile",
  "/binance-impuestos-chile",
  "/quienes-somos",
  "/preguntas",
  "/blog",
  "/blog/:path*",
  "/terminos",
  "/privacidad",
  "/cookies",
];

const maintenanceNoIndexHeaders = publicMaintenanceRoutes.map((source) => ({
  source,
  headers: noIndexHeaders,
}));

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "pdf-parse"],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.ledgera.cl",
          },
        ],
        destination: "https://ledgera.cl/:path*",
        permanent: true,
      },
      {
        source: "/legal/terminos",
        destination: "/terminos",
        permanent: false,
      },
      {
        source: "/legal/privacidad",
        destination: "/privacidad",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/googlead48e80d7c2d1421.html",
          destination: "/google-search-console-verification",
        },
      ],
    };
  },

  async headers() {
    return [
      ...(isMaintenanceMode
        ? [
            ...maintenanceNoIndexHeaders,
            {
              source: "/robots.txt",
              headers: noIndexHeaders,
            },
            {
              source: "/sitemap.xml",
              headers: noIndexHeaders,
            },
            {
              source: "/mantenimiento",
              headers: noIndexHeaders,
            },
          ]
        : []),
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/fonts/:path*",
        headers: [
          ...securityHeaders,
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
