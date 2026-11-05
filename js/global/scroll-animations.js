// Scroll animations (Motion) + sway. Pakai class di HTML, lalu panggil initAnimations().
//
// Masuk saat scroll (elemen sendiri): anim anim-left | anim-right | anim-up | anim-down | anim-zoom | anim-fade
// Ornamen (observe parent):           orn orn-left | orn-right | orn-bottom | orn-top
// Goyang loop:                        flower-sway
//
// Atribut opsional:
//   data-delay="0.2"  data-duration="1"  data-distance="40" (px, khusus anim-*)
//   data-sway-rotate="2"      derajat; + = searah jarum jam, - = berlawanan
//   data-sway-origin="top left"  (default "bottom left")
//   data-sway-duration="3"   data-sway-delay="0"

const SCROLL_ANIMATIONS = {
  "anim-left": { from: (d) => `translateX(-${d}px)`, parent: false },
  "anim-right": { from: (d) => `translateX(${d}px)`, parent: false },
  "anim-up": { from: (d) => `translateY(${d}px)`, parent: false },
  "anim-down": { from: (d) => `translateY(-${d}px)`, parent: false },
  "anim-zoom": { from: () => "scale(0.85)", parent: false },
  "anim-fade": { from: () => "none", parent: false },

  "anim-bounce": { from: () => "scale(0)", parent: false, spring: true },
  "anim-fadein": { from: (d) => `translateY(${d}px)`, parent: false, distance: 100, duration: 0.7, amount: 0.1 },

  "orn-left": { from: () => "translateX(-100%)", parent: true },
  "orn-right": { from: () => "translateX(100%)", parent: true },
  "orn-bottom": { from: () => "translateY(100%)", parent: true },
  "orn-top": { from: () => "translateY(-100%)", parent: true },
  "orn-enter-left": { from: (d) => `-${d}px 0px`, property: "translate", duration: 0.45 },
  "orn-enter-right": { from: (d) => `${d}px 0px`, property: "translate", duration: 0.45 },
  "orn-enter-fade": { from: () => "none", property: "opacity", duration: 0.45 },
};

function initScrollAnimations(root = document) {
  const M = window.Motion;

  Object.keys(SCROLL_ANIMATIONS).forEach((cls) => {
    root.querySelectorAll(`.${cls}`).forEach((node) => {
      if (node.dataset.animInit) return;
      node.dataset.animInit = "1";

      const cfg = SCROLL_ANIMATIONS[cls];
      const distance = Number(node.dataset.distance) || cfg.distance || 40;
      const delay = Number(node.dataset.delay) || 0;
      const duration = Number(node.dataset.duration) || cfg.duration || 0.9;
      const amount = cfg.amount ?? (cfg.parent ? 0.1 : 0.3);
      const from = cfg.from(distance);
      const target = cfg.parent && node.parentElement ? node.parentElement : node;
      const entrance = cfg.property === "translate";
      const fadeEntrance = cfg.property === "opacity";

      if (entrance || fadeEntrance) {
        if (!("IntersectionObserver" in window)) {
          delete node.dataset.animInit;
          return;
        }
        node.style.opacity = "0";
        if (entrance) node.style.translate = from;
        const observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          try {
            const animation = node.animate(
              entrance
                ? [
                    { opacity: 0, translate: from },
                    { opacity: 1, translate: "0px 0px" },
                  ]
                : [{ opacity: 0 }, { opacity: 1 }],
              { duration: duration * 1000, delay: delay * 1000, easing: "ease-out", fill: "both" }
            );
            animation.onfinish = () => {
              node.style.opacity = "1";
              if (entrance) node.style.translate = "0px 0px";
              animation.cancel();
            };
          } catch {
            node.style.opacity = "1";
            if (entrance) node.style.translate = "0px 0px";
          }
        }, { threshold: 0.05, rootMargin: "40px 0px 40px 0px" });
        observer.observe(node);
        return;
      }

      if (!M || typeof M.animate !== "function" || typeof M.inView !== "function") return;
      const { animate, inView } = M;
      node.style.opacity = "0";
      node.style.transform = from;

      const keyframes = cfg.spring
        ? { opacity: [0, 1], scale: [0, 1] }
        : { opacity: [0, 1], transform: [from, "none"] };

      const transition = cfg.spring
        ? { type: "spring", stiffness: 700, damping: 30, delay }
        : { duration, delay, ease: "easeOut" };

      let done = false;
      inView(
        target,
        () => {
          if (done) return;
          done = true;
          animate(node, keyframes, transition);
        },
        { amount }
      );
    });
  });
}

function initSway(root = document) {
  root.querySelectorAll(".flower-sway").forEach((node) => {
    if (node.dataset.swayInit) return;
    node.dataset.swayInit = "1";

    const rotate = Number(node.dataset.swayRotate);
    const deg = Number.isFinite(rotate) && rotate !== 0 ? rotate : 2;
    const duration = Number(node.dataset.swayDuration) || 3;
    const delay = Number(node.dataset.swayDelay) || 0;

    node.style.transformOrigin = node.dataset.swayOrigin || "bottom left";

    node.animate(
      [{ rotate: "0deg" }, { rotate: `${deg}deg` }, { rotate: "0deg" }],
      {
        duration: duration * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: "ease-in-out",
      }
    );
  });
}

// Ombak. Class: wave-sway
// Atribut: data-sway-origin, data-sway-rotate, data-sway-duration, data-sway-delay
function initWave(root = document) {
  root.querySelectorAll(".wave-sway").forEach((node) => {
    if (node.dataset.swayInit) return;
    node.dataset.swayInit = "1";

    const rotate = Number(node.dataset.swayRotate);
    const deg = Number.isFinite(rotate) && rotate !== 0 ? rotate : 2;
    const a = Math.abs(deg);
    const duration = Number(node.dataset.swayDuration) || 4;
    const delay = Number(node.dataset.swayDelay) || 0;

    node.style.transformOrigin = node.dataset.swayOrigin || "top right";

    node.animate(
      [
        { rotate: "0deg", translate: "0px 0px", offset: 0 },
        { rotate: `${-deg * 0.5}deg`, translate: `0px ${a * 5}px`, offset: 0.25 }, // tenggelam
        { rotate: "0deg", translate: "0px 0px", offset: 0.5 },  // naik balik
        { rotate: `${-deg}deg`, translate: `${a * 3}px ${a * 2}px`, offset: 0.75 }, // goyang kanan-bawah
        { rotate: "0deg", translate: "0px 0px", offset: 1 },
      ],
      { duration: duration * 1000, delay: delay * 1000, iterations: Infinity, easing: "ease-in-out" }
    );
  });
}

function initAnimations(root = document) {
  initScrollAnimations(root);
  initSway(root);
  initWave(root);
}
