# ML Foundations from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds machine learning from first principles — loss,
gradient descent, backpropagation, regularization — ending with your own autograd
engine, after which PyTorch becomes a bookkeeping automation you fully understand.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [LLMs](../llms-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Learning Machine**
1. What Is Learning, Really? ✅
2. Loss & Gradient Descent ✅
3. Overfitting & the Train/Test Split ✅

**Part II — The Neural Network**
4. From Line to Network: Neurons & Activations ✅
5. Backpropagation: The Chain Rule, Mechanized ✅
6. Training Dynamics: Rates, Batches & Schedules ✅

**Part III — Beyond Basics**
7. Classification & Softmax ✅
8. Regularization: Dropout & Weight Decay ✅
9. Convolutions: Kernels That See ✅
10. Embeddings & Attention, Recast as Learning ✅
11. Why Frameworks Exist: The Autograd Contract ✅
12. Final Boss: A Tiny Autograd Engine in ~200 Lines ✅ *(micrograd, your version)*

All 12 chapters are fully written, each with runnable NumPy builds and verified
outputs. Things you build along the way: hand-fit and gradient-trained regression,
the train/test U-curve reproduced, the XOR wall broken with a hidden layer, backprop
verified against numerical gradients (to 1e-10), the three learning-rate fates, a
calibrated softmax classifier, regularized training before/after, Sobel edge maps,
learned embeddings matching counted ones — and an autograd engine that trains XOR.

## The rules of the course

1. **Start below the abstraction.** Before "import torch", answer "what does .backward() do?"
2. **Nothing is magic.** Loss surfaces and backprop are hand-computable at toy scale.
3. **Build a toy version.** The finale: your own autograd engine in ~200 lines.
4. **Then the stack is visible.** Frameworks automate Chapter 5's bookkeeping — nothing hidden.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
