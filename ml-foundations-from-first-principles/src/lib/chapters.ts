export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Learning Machine',
  'Part II — The Neural Network',
  'Part III — Beyond Basics',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-learning',
    order: 1,
    title: 'What Is Learning, Really?',
    blurb:
      'Learning is fitting parameters to data by minimizing error. Build: linear regression by hand — the whole paradigm in 20 lines.',
    part: 'Part I — The Learning Machine',
    written: true,
  },
  {
    slug: '02-loss-gradient-descent',
    order: 2,
    title: 'Loss & Gradient Descent',
    blurb:
      'The loss landscape, the downhill step, the learning rate. Build: descent on a parabola and a real loss surface, on camera.',
    part: 'Part I — The Learning Machine',
    written: true,
  },
  {
    slug: '03-overfitting-split',
    order: 3,
    title: 'Overfitting & the Train/Test Split',
    blurb:
      'A model that memorizes the past can’t predict the future. Build: watch test error rise while train error falls.',
    part: 'Part I — The Learning Machine',
    written: true,
  },
  {
    slug: '04-from-line-to-network',
    order: 4,
    title: 'From Line to Network: Neurons & Activations',
    blurb:
      'Stack linear layers with nonlinearities and XOR becomes solvable. Build: the hidden layer that beats the perceptron’s limit.',
    part: 'Part II — The Neural Network',
    written: true,
  },
  {
    slug: '05-backpropagation',
    order: 5,
    title: 'Backpropagation: The Chain Rule, Mechanized',
    blurb:
      'Backprop is bookkeeping for ∂loss/∂weight through the graph. Build: it by hand, verified against numerical gradients.',
    part: 'Part II — The Neural Network',
    written: true,
  },
  {
    slug: '06-training-dynamics',
    order: 6,
    title: 'Training Dynamics: Rates, Batches & Schedules',
    blurb:
      'Why the learning rate is the one hyperparameter that matters. Build: too big, too small, just right — loss curves compared.',
    part: 'Part II — The Neural Network',
    written: true,
  },
  {
    slug: '07-classification-softmax',
    order: 7,
    title: 'Classification & Softmax',
    blurb:
      'From regression to probabilities over classes. Build: a softmax classifier trained on real data.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '08-regularization',
    order: 8,
    title: 'Regularization: Dropout & Weight Decay',
    blurb:
      'Making the model worse on purpose so it generalizes better. Build: dropout and decay, before/after.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '09-convolutions',
    order: 9,
    title: 'Convolutions: Kernels That See',
    blurb:
      'Weight sharing across space — how networks see edges everywhere. Build: convolve an image with edge detectors.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '10-embeddings-attention-recap',
    order: 10,
    title: 'Embeddings & Attention, Recast as Learning',
    blurb:
      'The LLM course’s structures, derived as learned function approximators — same math, new lens.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '11-the-dl-stack',
    order: 11,
    title: 'Why Frameworks Exist: The Autograd Contract',
    blurb:
      'PyTorch/TF automate Chapter 5’s bookkeeping. Build: the contract — define-by-run, auto-derivatives.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '12-final-boss-autograd',
    order: 12,
    title: 'Final Boss: A Tiny Autograd Engine in ~200 Lines',
    blurb:
      'A Value class that records operations and backprops through anything — micrograd, your version.',
    part: 'Part III — Beyond Basics',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Machine Learning on One Page',
    blurb:
      'Loss, gradients, backprop and training dynamics on one page — the model, the failure modes, and the fixes.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the autograd engine from Chapter 12 — gradients, networks, overfitting, convolutions. Each is checkable by you alone.',
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
