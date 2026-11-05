// ---------- animasi .animate + data-animate (IntersectionObserver di index.tsx, threshold 0.1) ----------
let animObserver = null;
function observeAnimations(root = document) {
  if (!animObserver) {
    animObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const animation = entry.target.dataset.animate;
        if (animation) entry.target.classList.add(animation);
        animObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
  }
  $$(".animate[data-animate]", root).forEach((n) => animObserver.observe(n));
}

