"use client";

import { APP_NAME } from "@/config/constants";

export function LandingStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: APP_NAME,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            description: "Безплатен план с ограничени функции",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "150",
            bestRating: "5",
            worstRating: "1",
          },
          description:
            "Фактури и известия за български фирми — ясни реквизити и проследяване на документи",
          url: process.env.NEXT_PUBLIC_APP_URL || "https://invoicy.bg",
          inLanguage: "bg-BG",
        }),
      }}
    />
  );
}
