// Import all blog posts
import { post as diffusionModels } from './diffusion_models.js'
import { post as attnMasks } from './attn_masks.js'
import { post as aiGirlfriend } from './ai_girlfriend.js'
import { post as communityDetection } from './community_detection_nns.js'

// Export all posts as an array
export const posts = [
  diffusionModels,
  attnMasks,
  aiGirlfriend,
  communityDetection,
]

// Export individual posts for easy access
export {
  diffusionModels,
  attnMasks,
  aiGirlfriend,
  communityDetection,
}
