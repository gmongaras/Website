export const posts = [
  {
    slug: 'moe',
    title: 'On The Importance of MoE Router Tie Breaking',
    date: '2026-08-24',
    tags: ['Mixture of Experts', 'MoE', 'Machine Learning'],
    excerpt: 'What can go wrong when you use torch.topk for your MoE model',
  },
  {
    slug: 'linear_attn',
    title: 'Linear Attention',
    date: '2026-08-24',
    tags: ['Linear Attention', 'Attention', 'Transformers'],
    excerpt: 'Just talking about liner attention.',
  },
  {
    slug: 'deriving-from-scratch',
    title: 'Deriving From Scratch',
    date: '2026-08-24',
    tags: ['Machine Learning'],
    excerpt: 'Derive papers from scratch.',
  },
  {
    slug: 'deriving-mamba3',
    title: 'Deriving Mamba 3',
    date: '2026-08-24',
    tags: ['Mamba', 'Machine Learning'],
    excerpt: 'I having been working with MoEs a lot with personal projects.',
  },
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
  linear_attn: () => import('./linear_attention.js'),
  'deriving-from-scratch': () => import('./Deriving_From_Scratch.js'),
  'deriving-mamba3': () => import('./deriving_mamba3_....js'),
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
