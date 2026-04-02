import { Metadata } from "next";
import { APP_NAME, APP_DEFAULT_TITLE, APP_DESCRIPTION, SEO_KEYWORDS } from "@/config/constants";

export const metadata: Metadata = {
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  openGraph: {
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    type: "website",
    locale: "bg_BG",
    siteName: APP_NAME,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} – invoicing`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
  },
};
