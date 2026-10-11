import { MetadataRoute } from 'next'
import { appUrl } from '@/lib/brand'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appUrl(),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
