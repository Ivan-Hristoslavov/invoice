import { MetadataRoute } from 'next';
import { PUBLIC_APP_URL_FALLBACK } from '@/config/constants';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || PUBLIC_APP_URL_FALLBACK;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/invoices/',
          '/clients/',
          '/companies/',
          '/products/',
          '/signin',
          '/signup',
          '/forgot-password',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/invoices/',
          '/clients/',
          '/companies/',
          '/products/',
          '/signin',
          '/signup',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
