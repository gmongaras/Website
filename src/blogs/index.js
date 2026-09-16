export const posts = [
  {
    slug: 'diffusion-models',
    title: 'Diffusion Models - DDPMs, DDIMs, and Classifier Free Guidance',
    date: '2023-03-13',
    tags: ['Neural Networks', 'Diffusion models', 'DDIM', 'DDPM', 'Machine Learning'],
    excerpt: 'Explanation of how old diffusion models (DDPM and DDIM) work',
  },
  {
    slug: 'attn-masks',
    title: 'How Do Self-Attention Masks Work',
    date: '2022-10-27',
    tags: ['Neural Networks', 'Attention', 'Machine Learning', 'Self attention'],
    excerpt: 'Explanation of how different types of attention masks work in detail.',
  },
  {
    slug: 'ai-girlfriend',
    title: 'Coding a Virtual AI Girlfriend',
    date: '2023-02-12',
    tags: ['Neural Networks', 'AI Girlfriend', 'Machine Learning'],
    excerpt: 'Building an AI girlfriend using an old diffusion model and GPT 2 on subtitle data',
  },
  {
    slug: 'community-detection-neural-networks',
    title: 'Community Detection with Neural Networks',
    date: '2022-04-10',
    tags: ['Neural Networks', 'Graph Theory', 'Machine Learning', 'Research'],
    excerpt: 'Using neural networks to solve community detection problems faster and more accurately than traditional algorithms like Girvan-Newman.',
  },
]

const postLoaders = {
  moe: () => import('./on_the_importance_of_moe_router_tie_breaking.js'),
  'diffusion-models': () => import('./diffusion_models.js'),
  'attn-masks': () => import('./attn_masks.js'),
  'ai-girlfriend': () => import('./ai_girlfriend.js'),
  'community-detection-neural-networks': () => import('./community_detection_nns.js'),
}

export const loadPost = async (slug) => {
  const loader = postLoaders[slug]
  if (!loader) return null
  const module = await loader()
  return module.post
}
