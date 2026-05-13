import { MetadataRoute } from 'next';
import { PUBLIC_APP_URL_FALLBACK } from '@/config/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || PUBLIC_APP_URL_FALLBACK;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
