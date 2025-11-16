// Projects data
export const projects = [
  {
    name: "On the Expressiveness of Softmax Attention",
    date: "2025-03-29",
    desc: "Code for my paper \"On the Expressiveness of Softmax Attention: A Recurrent Neural Network Perspective\" ",
    image: "/projects/on_the_expressiveness_of_sm_attn.png",
    skills: [ "Transformers", "Pretraining", "Linear attention", "Research", ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/On-the-Expressiveness-of-Softmax-Attention-A-Recurrent-Neural-Network-Perspective" }
    ]
  },
  {
    name: "Stable Diffusion 3 From Scratch",
    date: "2024-12-21",
    desc: "Code for bulding and training stable diffusion 3 from scratch as well as data collection / curation for training.",
    image: "/projects/stable_diffusion_3_from_scratch.png",
    skills: [ "Diffusion models", "Pretraining", "Parallel computing", "Data collection" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Stable-Diffusion-3-From-Scratch" }
    ]
  },
  {
    name: "Cottention: Linear Transformers With Cosine Attention",
    date: "2023-09-20",
    desc: "Code for my research paper \"Cottention: Linear Transformers With Cosine Attention\"",
    image: "/projects/cottention.png",
    skills: [ "Cuda kernels", "Transformers", "Linear attention", "Research" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Cottention_Transformer" }
    ]
  },
  {
    name: "Protogen Code",
    date: "2025-03-01",
    desc: "Arduino and adafruit code for my protogen",
    image: "",
    skills: [ "Arduino", "Adafruit", "Circuits" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Protogen_Code_Public" }
    ]
  },
  {
    name: "GRPO DAPO Tests ",
    date: "2025-04-08",
    desc: "Tests for RLHFing a llama model with GRPO and DAPO.",
    image: "/projects/grpo_dapo_tests_.jpg",
    skills: [ "Finetuning", "RLHF", "GRPO", "DAPO" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/GRPO-DAPO-Tests" }
    ]
  },
  {
    name: "Triton Efficient Kronecker Product",
    date: "2025-08-01",
    desc: "Triton kernel used to perform a reduced tensor product to implement an efficient squared inner product.",
    image: "/projects/kron_prod.png",
    skills: [ "Triton", "Tensor product" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Triton-Efficient-Kronecker-Product" }
    ]
  },
  {
    name: "Resolution Invariant Diffusion AE",
    date: "2025-08-01",
    desc: "An attempt at making a resolution invariant AE for a diffusion model",
    image: "/projects/res_invariant_vae.png",
    skills: [ "Diffusion Models", "VAE", "VAE training" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Res-Invariant-Diffusion-AE" }
    ]
  },
  {
    name: "Latent Diffusion Model Imagenet 2012",
    date: "2025-01-16",
    desc: "Project: Latent Diffusion Model Imagenet 2012",
    image: "/projects/latent_diffusion_model_imagenet_2012.jpeg",
    skills: [],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Latent_Diffusion_Model_Imagenet2012" }
    ]
  },
  {
    name: "Triton Kernels",
    date: "2025-03-01",
    desc: "Implemented various triton kernels from scratch following the Triton tutorial",
    image: "/projects/triton_kernels.png",
    skills: [ "Triton" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Triton_Kernels" }
    ]
  },
  {
    name: "Image Gradient Thing",
    date: "2025-01-01",
    desc: "Some weird thing I made s.t. videos are composed of moving lines following the graidnet of the video",
    image: "/projects/image_gradient_thing.gif",
    skills: [ "Python", "Video processng" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Image_Gradient_Thing" }
    ]
  },
  {
    name: "Token Merging Tests",
    date: "2024-12-18",
    desc: "Project: Token Merging Tests",
    image: "/projects/token_merging_tests.png",
    skills: [ "Efficient diffusion models", "Model inference", "Inference optimization" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Token_Merging_Tests" }
    ]
  },
  {
    name: "Rust Neural Network",
    date: "2024-12-27",
    desc: "Neural network built in Rust.",
    image: "/projects/rust_neural_network.jpeg",
    skills: [ "Rust", "Neural networks" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Rust_Neural_Network" }
    ]
  },
  {
    name: "Causal Transformer Base",
    date: "2024-12-07",
    desc: "Causal transformer training I use for all my experiments.",
    image: "/projects/causal_transformer_base.jpg",
    skills: [ "Causal transformer", "Pretraining" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/CausalTransformerBase" }
    ]
  },
  {
    name: "Learnable Rotary Embedings",
    date: "2024-10-21",
    desc: "Experiment I did to test out what would happen if I made rotary embeddings learnable.",
    image: "/projects/learnable_rotary_embeddings.webp",
    skills: [ "RoPE", "Learnable RoPE", "Positional Encodings" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Learnable_Rotary_Embeddings" }
    ]
  },
  {
    name: "Matrix Gradient Calculator",
    date: "2024-07-07",
    desc: "Built a calculator that takes in a matrix function and it calculates the gradient of said function wrt. all input matrices",
    image: "/projects/matrix_gradient_calculator.png",
    skills: [ "Matrix function gradient calculation" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Matrix_Gradient_Calculator" }
    ]
  },
  {
    name: "CudaKernelDemo",
    date: "2024-04-16",
    desc: "Demo I made to show off how cuda kernels work.",
    image: "/projects/cudakerneldemo.png",
    skills: [ "Cuda", "C++" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/CudaKernelDemo" }
    ]
  },
  {
    name: "Reinforcement Learning Stuff",
    date: "2024-03-10",
    desc: "Some RL experiments I did to learn RL.",
    image: "/projects/cart_pole_ppo.png",
    skills: [ "Reinforcement learning", "PPO"  ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Reinforcement_Learning_Stuff" }
    ]
  },
  {
    name: "Yann LeCun Bot",
    date: "2024-01-24",
    desc: "Scraped Twitter (X) for Yann LeCun data ad turned him into a bot.",
    image: "/projects/yann_lecun.webp",
    skills: [ "Finetuning", "RLHF", "Scraping" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Yann_FT" }
    ]
  },
  {
    name: "Diffusion TTS",
    date: "2023-09-21",
    desc: "TTS diffusion models I was playing around with.",
    image: "/projects/diffusion_tts.png",
    skills: [ "Diffusion models", "text to speech", "TTS" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Diffusion-TTS" }
    ]
  },
  {
    name: "Wizard QLoRA Finetuning",
    date: "2023-09-17",
    desc: "Built a script to finetune Wizard 7B in 4 bit precision.",
    image: "/projects/wizard_qlora.png",
    skills: [ "Low precision finetuning", "finetuning", "LLMs" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Wizard_QLoRA_Finetuning" }
    ]
  },
  {
    name: "AI Girlfriend",
    date: "2023-01-16",
    desc: "AI girlfriend I made in a couple of months... I am A CS major",
    image: "/projects/ai_girlfriend.png",
    skills: [],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/AI_Girlfriend" }
    ]
  },
  {
    name: "Diffusion Models From Scratch",
    date: "2022-09-10",
    desc: "Created a diffusion model from scratch back when U-net were cool",
    image: "/projects/diffusion_models_from_scratch.png",
    skills: [ "Diffusion models", "Pixel diffusion", "U-net", "Model training" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Diffusion_models_from_scratch" }
    ]
  },
  {
    name: "YOLOX From Scratch",
    date: "2022-04-19",
    desc: "Implemented the YoloX algorithm from scratch to learn how Yolo works.",
    image: "/projects/yolox_from_scratch.png",
    skills: [ "Yolo", "Pretraining", "Object detection" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/YOLOX_From_Scratch" }
    ]
  },
  {
    name: "GAN TextGen",
    date: "2022-06-16",
    desc: "Old project where I attempted to get GANs to generate text.",
    image: "/projects/gan_textgen.png",
    skills: [ "GANs", "Text generation", ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/GAN_TextGen" }
    ]
  },
  {
    name: "Resume Parser",
    date: "2022-11-14",
    desc: "Project I made for a hackathon that parses resumes using a bunch of AI algorithms.",
    image: "/projects/resume_parser.png",
    skills: [ "OCR" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/resume-parser" }
    ]
  },
  {
    name: "MetaU Capstone",
    date: "2022-06-16",
    desc: "Project I did as a part of my MetaU internship.",
    image: "/projects/metau_capstone.png",
    skills: [],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/MetaU_Capstone" }
    ]
  },
  {
    name: "Vision Transformers From Scratch",
    date: "2022-03-01",
    desc: "Build a ViT from scratch to do image classification",
    image: "/projects/vision_transformers_from_scratch.jpg",
    skills: [ "Pretraining", "Image classification", "Transformers" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/ViTs_From_Scratch" }
    ]
  },
  {
    name: "Transformers From Scratch",
    date: "2022-01-25",
    desc: "Built transformers for translation from scratch following the \"Attention is All You Need Paper\".",
    image: "/projects/transformers_from_scratch.png",
    skills: [ "Transformers", "Translation", "Pretraining" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Transformers_From_Scratch" }
    ]
  },
  {
    name: "Data Structures Search Engine Project",
    date: "2021-12-27",
    desc: "Built a search engine for my data structures final in pure C++.",
    image: "/projects/data_structures_search_engine_project.png",
    skills: [ "C++", "Search engines" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/21f-srch-ngn-linked-list-unary-tree" }
    ]
  },
  {
    name: "Dino Game AI V2",
    date: "2021-07-07",
    desc: "AI I made that learns how to play the Dino game with the NEAT evolutionary algorithm",
    image: "/projects/dino_game_ai_v2.jpg",
    skills: [ "Evolutionary Algos", "NEAT" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Dino_Game_AI_V2" }
    ]
  },
  {
    name: "Gradient Descent From Scratch",
    date: "2021-07-30",
    desc: "Build a basic classification neural network and built the autograd \"engine\" from scratch in numpy, no torch.",
    image: "/projects/gradient_descent_for_bce_loss.jpg",
    skills: [ "Gradient decent", "Autograd" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Visualizing_Gradient_Descent_For_BCE_Loss" }
    ]
  },
  {
    name: "Anime StyleGAN",
    date: "2021-06-05",
    desc: "Finetuned StyleGAN2 on some anime images and built a site to sample from it.",
    image: "/projects/anime_stylegan.jpg",
    skills: [ "GAN", "Finetuning" ],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Anime_StyleGAN_Website" }
    ]
  },
  {
    name: "Dorahack Apr 2021 Project",
    date: "2021-05-20",
    desc: "Project for the Dorahacks Hackathon in 2021",
    image: "/projects/dorahack_apr_2021_project.jpg",
    skills: [],
    links: [
      { label: "Code", href: "https://github.com/gmongaras/0xA455" }
    ]
  },
]