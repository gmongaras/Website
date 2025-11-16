import React from 'react'
import { Helmet } from 'react-helmet-async'

const SEO = ({ 
  title, 
  description, 
  keywords = [], 
  image = "/og-image.png", 
  url, 
  type = "website",
  structuredData = null 
}) => {
  const siteUrl = "https://gmongaras.me"
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`
  
  const defaultTitle = "Gabriel Mongaras — AI Engineer & Researcher"
  const defaultDescription = "AI Engineer & Researcher focused on diffusion models, attention mechanisms, and efficient AI systems. Experience at Etched, Google, Amazon, and Meta."
  const defaultKeywords = [
    "Gabriel Mongaras",
    "AI Engineer", 
    "Machine Learning",
    "Diffusion Models",
    "Neural Networks",
    "Deep Learning",
    "Research",
    "Software Engineer",
    "PyTorch",
    "Transformers",
    "Attention Mechanisms",
    "Generative AI"
  ]

  const finalTitle = title ? `${title} | Gabriel Mongaras` : defaultTitle
  const finalDescription = description || defaultDescription
  const finalKeywords = [...defaultKeywords, ...keywords].join(', ')

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content="Gabriel Mongaras" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Gabriel Mongaras Portfolio" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@gmongaras" />
      <meta name="twitter:creator" content="@gmongaras" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#3B0066" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}

export default SEO
