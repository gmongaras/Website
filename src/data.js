// Centralized data pulled from the resume
export const profile = {
  name: "Gabriel Mongaras",
  tagline: "AI Engineer • Researcher • Builder",
  summary: "Software Engineer focused on AI research, diffusion models, and efficient attention mechanisms. Experience at Google, Amazon, Meta, and Etched. Passionate about building and scaling AI systems.",
  location: "Dallas, TX",
  email: "gabriel@mongaras.com",
  emailAlt: "gmongaras@smu.edu",
  phone: "512-659-5405",
  links: {
    site: "https://gabrielm.cc",
    github: "https://github.com/gmongaras",
    linkedin: "https://www.linkedin.com/in/gmongaras",
    youtube: "https://www.youtube.com/@gabrielmongaras",
    x: "https://x.com/gmongaras",
  }
}

export const education = [
  {
    school: "Southern Methodist University — Lyle School of Engineering",
    program: "M.S. Computer Science",
    location: "Dallas, TX",
    date: "Expected May 2026",
  },
  {
    school: "Southern Methodist University — Lyle School of Engineering",
    program: "B.S. Computer Science; B.S. Statistical Science; B.S. Data Science; B.A. Mathematics",
    location: "Dallas, TX",
    date: "Graduated May 2025 • GPA 3.86",
  },
  {
    school: "Austin Community College",
    program: "A.S. Computer Programming (Occupational Skills Award)",
    location: "Austin, TX",
    date: "May 2021 • GPA 3.9",
  },
]

export const skills = {
  coding: ["Python", "C++", "CUDA", "Rust", "Triton", "C", "JavaScript", "SQL", "PL/SQL", "AWS", "Linux", "Arduino", "ARM", "Android SDK", "Java", "Django", "Flask", "HTML", "CSS"],
  ai: ["Neural Networks", "PyTorch", "TensorFlow", "JAX", "Transformers", "Diffusion Models", "GANs", "LoRA", "LLM Pretraining/Finetuning", "Inference", "HuggingFace", "Reinforcement Learning", "CNNs", "Object Detection", "Audio Processing", "OpenAI/GPT"],
  other: ["Cloud Platforms", "Quantum Computing", "Blockchain", "Agile", "Eagerness To Learn"]
}

export const experience = [
  {
    company: "Etched",
    title: "Software Engineer",
    location: "San Jose, CA",
    date: "Jun 2025 — Present",
    bullets: [
      "Building the codebase used for Sohu in production."
    ]
  },
  {
    company: "Google",
    title: "Student Researcher",
    location: "Dallas, TX",
    date: "Oct 2024 — Dec 2024",
    bullets: [
      "Researched methods to accelerate diffusion model inference.",
      "Exploratory experiments and token-merging tests."
    ],
    links: [{ label: "Token Merging Tests", href: "https://github.com/gmongaras/Token_Merging_Tests" }]
  },
  {
    company: "Google",
    title: "Software Engineering Intern (Labs)",
    location: "Seattle, WA",
    date: "May 2024 — Aug 2024",
    bullets: [
      "Researched video editing via inversion techniques; literature review of SOTA.",
      "Implemented techniques in JAX for reuse across research efforts."
    ]
  },
  {
    company: "Hotshot",
    title: "AI Engineer",
    location: "Remote",
    date: "Apr 2024 — May 2024",
    bullets: [
      "Shipped changes to a new model improving upon Act 1."
    ]
  },
  {
    company: "Amazon",
    title: "Applied Science Intern (Alexa ESP)",
    location: "Sunnyvale, CA",
    date: "May 2023 — Aug 2023",
    bullets: [
      "Improved multi-device wake-word localization using deep learning.",
      "Explored accuracy/size/speed trade-offs; engineered new input features."
    ]
  },
  {
    company: "Meta",
    title: "Intern (Meta University)",
    location: "Menlo Park, CA",
    date: "May 2022 — Aug 2022",
    bullets: [
      "Built an Android app; trained a Transformer WGAN to generate fortunes."
    ]
  },
  {
    company: "Southern Methodist University",
    title: "Undergraduate Research Assistant",
    location: "Dallas, TX",
    date: "Aug 2021 — May 2024",
    bullets: [
      "Used MLPs to correct THC state transition energy estimation errors.",
      "Achieved 100x improvement vs THC for MP3 values."
    ]
  },
]

export const projects = [
  {
    name: "Stable Diffusion 3 From Scratch",
    date: "Spring 2025",
    desc: "Custom ViT and full training pipeline to train SD-like models entirely from scratch; scaled to 1.2B params and 1024×1024.",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Stable-Diffusion-3-From-Scratch" }
    ]
  },
  {
    name: "Cottention (Cosine Attention)",
    date: "2023–2024",
    desc: "Linear-time attention method with competitive accuracy and lower memory usage.",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Cottention_Transformer" },
      { label: "arXiv", href: "https://arxiv.org/abs/2409.18747" }
    ]
  },
  {
    name: "Diffusion Models From Scratch",
    date: "2022–2023",
    desc: "DDPM→DDIM pipeline with Classifier-Free Guidance implemented in pure PyTorch.",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/Diffusion_models_from_scratch" }
    ]
  },
  {
    name: "YOLOX From Scratch",
    date: "2022",
    desc: "Object detection model from scratch; series of explanatory writeups.",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/YOLOX_From_Scratch" },
      { label: "Writeup", href: "https://gmongaras.medium.com/list/yolox-explantation-1bff11aa9911" }
    ]
  },
  {
    name: "MetaU Capstone: Fortune App",
    date: "Summer 2022",
    desc: "Android app with a Transformer WGAN generating shareable fortunes.",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/MetaU_Capstone" }
    ]
  }
]

export const publications = [
  {
    title: "On the Expressiveness of Softmax Attention: A Recurrent Neural Network Perspective",
    venue: "Preprint",
    links: [
      { label: "Code", href: "https://github.com/gmongaras/On-the-Expressiveness-of-Softmax-Attention-A-Recurrent-Neural-Network-Perspective" },
      { label: "arXiv", href: "https://arxiv.org/abs/2507.23632" }
    ]
  },
  {
    title: "Cottention: Linear Transformers With Cosine Attention",
    venue: "Springer Nature (Book Chapter)",
    links: [
      { label: "arXiv", href: "https://arxiv.org/abs/2409.18747" },
      { label: "Springer", href: "https://link.springer.com/book/10.1007/978-3-031-92602-0?sap-outbound-id=AD9F926E0AA16D13049BD2370EAFCAD37B0D3F1F" }
    ]
  },
  {
    title: "Diffusion Models — DDPMs, DDIMs, and Classifier Free Guidance",
    venue: "Better Programming",
    links: [
      { label: "Article", href: "https://betterprogramming.pub/diffusion-models-ddpms-ddims-and-classifier-free-guidance-e07b297b2869" }
    ]
  },
  {
    title: "How Do Self-Attention Masks Work?",
    venue: "MLearning.ai",
    links: [
      { label: "Article", href: "https://medium.com/mlearning-ai/how-do-self-attention-masks-work-72ed9382510f" }
    ]
  },
  {
    title: "Coding A Virtual AI Girlfriend",
    venue: "MLearning.ai",
    links: [
      { label: "Article", href: "https://medium.com/mlearning-ai/coding-a-virtual-ai-girlfriend-f951e648aa46" }
    ]
  },
]

export const activitiesAwards = {
  activities: ["Artificial Intelligence Club (President)", "Cybersecurity Club", "Computer Science Club", "Commons Council"],
  awards: ["Cum Laude", "Phi Beta Kappa", "Hunt Scholars", "Hyer Society", "Rotunda Scholars", "Hilltop Scholar", "University Honor Roll", "Discovery Scholar"]
}
