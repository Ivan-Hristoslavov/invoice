import { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION, SEO_KEYWORDS } from "@/config/constants";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://facturapro.bg';

export function generateMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${APP_NAME}`;
  const fullDescription = description || APP_DESCRIPTION;
  const url = `${baseUrl}${path}`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: SEO_KEYWORDS,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: APP_NAME,
      locale: "bg_BG",
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
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

export function generateStructuredData(type: "SoftwareApplication" | "Organization" | "WebPage", data?: Record<string, any>) {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
  };

  if (type === "SoftwareApplication") {
    return {
      ...base,
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BGN",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "150",
      },
      description: APP_DESCRIPTION,
      url: baseUrl,
      inLanguage: "bg-BG",
      ...data,
    };
  }

  if (type === "Organization") {
    return {
      ...base,
      name: APP_NAME,
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: APP_DESCRIPTION,
      address: {
        "@type": "PostalAddress",
        addressCountry: "BG",
      },
      ...data,
    };
  }

  return {
    ...base,
    ...data,
  };
}
