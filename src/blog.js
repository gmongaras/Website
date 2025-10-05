// Simple static blog posts. You can replace with a CMS or markdown later.
export const posts = [
  {
    slug: "building-cottention",
    title: "Building Cottention: Notes on Linear Attention",
    date: "2024-10-12",
    tags: ["Attention","Transformers","Research"],
    excerpt: "Design notes, stability gotchas, and how cosine similarity changed my approach.",
    body: `Linear attention has many faces. In this note I share the design decisions behind Cottention, including normalization, numerical stability tricks, and what broke at longer contexts...`
  },
  {
    slug: "diffusion-tricks",
    title: "Diffusion Training Tricks I Keep Reusing",
    date: "2025-03-21",
    tags: ["Diffusion","PyTorch"],
    excerpt: "Small optimizations that compound when you scale resolution and batch size.",
    body: `From dataset streaming patterns to EMA handling and scheduler swaps, here are the small tricks that consistently helped me train faster and more stably...`
  }
]
