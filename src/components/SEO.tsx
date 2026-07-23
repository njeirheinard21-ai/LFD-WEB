import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  url?: string;
  image?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string;
}

export function SEO({ 
  title, 
  description, 
  name = 'LFD Service - 1st Maga Center for Optimal Healthcare', 
  type = 'website',
  url = 'https://lfdservice.org',
  image = 'https://i.imgur.com/r0N9aBe.png', // Logo or main image
  schema,
  keywords = 'lfd service, living food and drinks, Optimal health care, Health Care, lfdservice.org, lfd service.com, 1st maga center for Optimal healthcare'
}: SEOProps) {
  const defaultTitle = 'LFD Service | Optimal Healthcare & Living Food and Drinks';
  const displayTitle = title ? `${title} | LFD Service` : defaultTitle;
  const defaultDesc = 'LFD Service is the 1st Maga Center for Optimal healthcare. We provide living food and drinks, natural health solutions, and wellness seminars for chronic disease management.';
  const displayDesc = description || defaultDesc;

  // Default Organization & LocalBusiness Schema
  const defaultSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalBusiness",
        "name": "LFD Service - 1st Maga Center for Optimal Healthcare",
        "image": image,
        "url": url,
        "telephone": "+123456789", // Fill with real phone
        "description": displayDesc,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "123 Health Ave",
          "addressLocality": "Wellness City",
          "addressRegion": "WC",
          "postalCode": "12345",
          "addressCountry": "US"
        }
      },
      {
        "@type": "Organization",
        "name": "Living Food and Drinks",
        "url": url,
        "logo": image
      }
    ]
  };

  const finalSchema = schema ? (Array.isArray(schema) ? [...defaultSchema["@graph"], ...schema] : [...defaultSchema["@graph"], schema]) : defaultSchema["@graph"];

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{displayTitle}</title>
      <meta name='description' content={displayDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={name} />
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDesc} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": finalSchema
        })}
      </script>
    </Helmet>
  );
}
