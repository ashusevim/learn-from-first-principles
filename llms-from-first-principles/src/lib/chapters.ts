export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Tokens & Meaning',
  'Part II — The Transformer',
  'Part III — Using & Serving',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-an-llm',
    order: 1,
    title: 'What Is an LLM, Really?',
    blurb:
      'No thinking, no magic: a next-token predictor trained on the internet. Build: a bigram model that “writes” — and see where it fails.',
    part: 'Part I — Tokens & Meaning',
    written: true,
  },
  {
    slug: '02-tokenizers-bpe',
    order: 2,
    title: 'Tokens: Words Too Big, Characters Too Small',
    blurb:
      'Byte-pair encoding builds a vocabulary from the corpus. Build: a tiny BPE tokenizer that learns merges from scratch.',
    part: 'Part I — Tokens & Meaning',
    written: true,
  },
  {
    slug: '03-embeddings',
    order: 3,
    title: 'Embeddings: Meaning as Geometry',
    blurb:
      'Words become vectors; similarity becomes distance. Build: co-occurrence embeddings and the king − man + woman trick.',
    part: 'Part I — Tokens & Meaning',
    written: true,
  },
  {
    slug: '04-attention',
    order: 4,
    title: 'Attention: The Core Idea',
    blurb:
      'Every token asks “who should I look at?” — queries, keys, values, softmax. Build: self-attention in ~20 lines of NumPy.',
    part: 'Part II — The Transformer',
    written: true,
  },
  {
    slug: '05-multihead-positional',
    order: 5,
    title: 'Multi-Head Attention & Positional Encoding',
    blurb:
      'Multiple attention “eyes” plus a sense of word order. Build: a full attention block with causal masking.',
    part: 'Part II — The Transformer',
    written: true,
  },
  {
    slug: '06-transformer-block',
    order: 6,
    title: 'The Transformer Block',
    blurb:
      'Attention + MLP + residuals + layer norm — the Lego brick of GPT. Build: a stackable block, shapes verified.',
    part: 'Part II — The Transformer',
    written: true,
  },
  {
    slug: '07-training',
    order: 7,
    title: 'Training: Next-Token Loss',
    blurb:
      'Cross-entropy on the next token, backprop, a loss curve that falls. Build: train your tiny model on a real corpus.',
    part: 'Part II — The Transformer',
    written: true,
  },
  {
    slug: '08-generation-sampling',
    order: 8,
    title: 'Generation: Sampling, Temperature & Top-k',
    blurb:
      'Why the model rambles or repeats — the softmax dial. Build: a sampler with temperature and top-k, outputs compared.',
    part: 'Part III — Using & Serving',
    written: true,
  },
  {
    slug: '09-prompting-context',
    order: 9,
    title: 'Prompting & Context Windows',
    blurb:
      'Prompts are just conditioning; the window is finite memory. Build: watch quality collapse past the window edge.',
    part: 'Part III — Using & Serving',
    written: true,
  },
  {
    slug: '10-finetuning-rlhf',
    order: 10,
    title: 'Fine-tuning & RLHF, Conceptually',
    blurb:
      'Base model → instructed model: same architecture, different data. Build: a tiny fine-tune that changes style.',
    part: 'Part III — Using & Serving',
    written: true,
  },
  {
    slug: '11-serving-kv-cache',
    order: 11,
    title: 'Serving: KV Caches & Inference Speed',
    blurb:
      'Why generating token 1000 is slower than token 2 — and the cache that fixes most of it. Build: measure with and without.',
    part: 'Part III — Using & Serving',
    written: true,
  },
  {
    slug: '12-final-boss-mini-gpt',
    order: 12,
    title: 'Final Boss: A Mini-GPT in ~300 Lines',
    blurb:
      'Tokenizer + transformer + training loop + sampler, one file — a language model that writes your corpus back.',
    part: 'Part III — Using & Serving',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: LLMs on One Page',
    blurb:
      'Tokens, attention, training and serving on one page — the model, the shapes, the sampling knobs, and the costs.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the mini-GPT from Chapter 12 — tokenize, attend, train, sample. Each is checkable by you alone.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
];

export function chapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chapterNeighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : undefined,
    next: i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : undefined,
  };
}
