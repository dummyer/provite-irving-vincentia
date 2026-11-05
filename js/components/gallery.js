
// Component module: classic script, shares app.js globals.
// GalleryCarouselEmbla.tsx

function setupGallery() {
  const c = state.data.dataContent;

  const apiImages = Array.isArray(c.galleryImageData)
    ? c.galleryImageData
      .filter((it) => it && (it.url || it.src))
      .map((it) => {
        const raw = it.url || it.src;
        return raw.startsWith("http") ? raw : `${MEDIA}${raw}`;
      })
    : [];

  // Use gallery.webp when API has no gallery photos
  const images =
    apiImages.length > 0
      ? apiImages.map((src) => ({ src, type: "portrait" }))
      : [
        {
          src: "assets/images/gallery_1.webp",
          type: "portrait",
        },
      ];

  // Ensure gallery section is visible
  const gallery = $("#gallery");
  if (!gallery) return;
  gallery.classList.remove("hidden");

  const HEIGHT_VH = 70;
  const FALLBACK_LANDSCAPE = 3 / 2;
  const FALLBACK_PORTRAIT = 2 / 3.5;

  const ratios = {};
  let slides = [];
  let embla = null;
  let selectedSlide = null;
  let hasCentered = false;

  const container = $("#galleryContainer");
  const track = $("#galleryTrack");
  const dots = $("#galleryDots");

  const autoplay = window.EmblaCarouselAutoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  const buildSlides = () =>
    images.flatMap((img, imageIndex) => {
      const natural = ratios[imageIndex];
      const isLandscape =
        natural !== undefined
          ? natural > 1
          : img.type === "landscape";

      return isLandscape
        ? [0, 1, 2].map((part) => ({ img, imageIndex, part }))
        : [{ img, imageIndex, part: null }];
    });

  const slideHeightPx = () => (window.innerHeight * HEIGHT_VH) / 100;

  function renderTrack() {
    const h = container.clientHeight || slideHeightPx();

    track.innerHTML = "";
    track.style.backfaceVisibility = "hidden";

    slides.forEach((slide) => {
      const { img, imageIndex, part } = slide;
      const isPart = part !== null;

      const ratio = isPart
        ? (ratios[imageIndex] ?? img.ratio ?? FALLBACK_LANDSCAPE)
        : (img.ratio ?? FALLBACK_PORTRAIT);

      const width = isPart ? (h * ratio) / 3 : h * ratio;

      const outer = el("div", "relative flex-shrink-0");
      outer.style.height = `${HEIGHT_VH}svh`;
      outer.style.width = `${Math.ceil(width)}px`;

      const inner = el("div", "relative w-full h-full overflow-hidden");

      let visual;

      if (isPart) {
        visual = el("div", "w-full h-full cursor-zoom-in");
        visual.setAttribute("role", "img");
        visual.setAttribute(
          "aria-label",
          `Gallery ${imageIndex + 1} (${part + 1}/3)`
        );
        visual.style.backgroundImage = `url("${img.src}")`;
        visual.style.backgroundRepeat = "no-repeat";
        visual.style.backgroundSize = "300% 100%";
        visual.style.backgroundPosition = `${part * 50}% 0`;
      } else {
        visual = el(
          "img",
          "w-full h-full object-cover block cursor-zoom-in"
        );
        visual.src = img.src;
        visual.alt = `Gallery ${imageIndex + 1}`;
        visual.draggable = false;
      }

      visual.addEventListener("click", () => openZoom(imageIndex));

      const dim = el(
        "div",
        "absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none"
      );

      dim.dataset.imageIndex = imageIndex;

      inner.append(visual, dim);
      outer.appendChild(inner);
      track.appendChild(outer);
    });

    dots.innerHTML = "";

    images.forEach((_, imageIndex) => {
      const isLandscape = slides.some(
        (s) => s.imageIndex === imageIndex && s.part !== null
      );

      const dot = el("button", "hover transition-all duration-300");

      dot.type = "button";
      dot.style.height = "2px";
      dot.dataset.imageIndex = imageIndex;
      dot.dataset.landscape = isLandscape ? "1" : "0";

      dot.setAttribute("aria-label", `Go to photo ${imageIndex + 1}`);

      dot.addEventListener("click", () => {
        const idx = slides.findIndex(
          (s) =>
            s.imageIndex === imageIndex &&
            (s.part === null || s.part === 1)
        );

        embla?.scrollTo(idx);
        autoplay.reset();
      });

      dots.appendChild(dot);
    });
  }

  function paintSelected() {
    const imageIndex = slides[embla.selectedScrollSnap()]?.imageIndex;

    $$("[data-image-index]", track).forEach((n) => {
      n.style.opacity =
        Number(n.dataset.imageIndex) === imageIndex ? "0" : "0.5";
    });

    $$("button", dots).forEach((b) => {
      const active = Number(b.dataset.imageIndex) === imageIndex;
      const land = b.dataset.landscape === "1";

      b.style.width = `${active ? (land ? 36 : 24) : land ? 22 : 14}px`;
      b.style.backgroundColor = active
        ? "#FFFFFF"
        : "rgba(255,255,255,0.4)";
    });
  }

  function onSelect() {
    const idx = embla.selectedScrollSnap();
    const s = slides[idx];
    const prevImage = selectedSlide?.imageIndex;

    // Center landscape photos when entering a new image
    if (
      s &&
      s.part !== null &&
      s.part !== 1 &&
      prevImage !== undefined &&
      prevImage !== s.imageIndex
    ) {
      const center = slides.findIndex(
        (x) => x.imageIndex === s.imageIndex && x.part === 1
      );

      if (center >= 0) {
        selectedSlide = { imageIndex: s.imageIndex, part: 1 };
        embla.scrollTo(center);
        paintSelected();
        return;
      }
    }

    if (s) {
      selectedSlide = { imageIndex: s.imageIndex, part: s.part };
    }

    paintSelected();
  }

  function rebuild() {
    const prev = selectedSlide;

    slides = buildSlides();
    renderTrack();

    let startIndex = 0;

    if (!hasCentered) {
      if (ratios[0] !== undefined) {
        const center = slides.findIndex(
          (s) => s.imageIndex === 0 && (s.part === null || s.part === 1)
        );

        if (center >= 0) {
          startIndex = center;
          hasCentered = true;
        }
      }
    } else if (prev) {
      const same = slides.findIndex(
        (s) =>
          s.imageIndex === prev.imageIndex && s.part === prev.part
      );

      const sameImage = slides.findIndex(
        (s) => s.imageIndex === prev.imageIndex
      );

      startIndex = same >= 0 ? same : Math.max(sameImage, 0);
    }

    if (!embla) {
      embla = window.EmblaCarousel(
        $("#galleryViewport"),
        {
          loop: true,
          align: "center",
          containScroll: false,
          skipSnaps: false,
          startIndex,
        },
        [autoplay]
      );

      embla.on("select", onSelect);
      embla.on("reInit", onSelect);
    } else {
      embla.reInit({ startIndex });
    }

    onSelect();
  }

  // Read original image dimensions
  let pending = images.length;
  let rebuildTimer = null;

  const scheduleRebuild = () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 50);
  };

  images.forEach((img, i) => {
    const probe = new Image();

    probe.onload = () => {
      if (probe.naturalHeight) {
        ratios[i] = probe.naturalWidth / probe.naturalHeight;
      }

      if (--pending >= 0) scheduleRebuild();
    };

    probe.onerror = () => {
      --pending;
    };

    probe.src = img.src;
  });

  rebuild();

  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return; // address bar HP: lebar tetap
    lastWidth = window.innerWidth;
    scheduleRebuild();
  });

  $("#galleryPrev").addEventListener("click", () => {
    embla.scrollPrev();
    autoplay.reset();
  });

  $("#galleryNext").addEventListener("click", () => {
    embla.scrollNext();
    autoplay.reset();
  });

  // Zoom popup
  function openZoom(start) {
    let index = start;
    let scale = 1;
    let pan = { x: 0, y: 0 };
    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let panStart = { x: 0, y: 0 };

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    autoplay.stop();

    const box = el(
      "div",
      "fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
    );

    box.innerHTML = `
      <div class="absolute top-4 left-4 lg:top-6 lg:left-6 z-10 text-white text-sm lg:text-base font-medium" data-counter></div>
      <div class="absolute top-4 right-4 lg:top-6 lg:right-6 z-10 flex items-center gap-3 lg:gap-4" data-tools>
        <button type="button" class="hover text-white p-1" aria-label="Zoom in" data-in><svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 lg:w-7 lg:h-7"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        <button type="button" class="hover text-white p-1" aria-label="Zoom out" data-out><svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 lg:w-7 lg:h-7"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        <button type="button" class="hover text-white p-1" aria-label="Close" data-close><svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 lg:w-7 lg:h-7"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </div>
      <button type="button" class="hover absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-10 text-white p-2" aria-label="Previous" data-prev><svg viewBox="0 0 24 24" fill="none" class="w-7 h-7 lg:w-9 lg:h-9"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button type="button" class="hover absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-10 text-white p-2" aria-label="Next" data-next><svg viewBox="0 0 24 24" fill="none" class="w-7 h-7 lg:w-9 lg:h-9"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <img class="max-w-full max-h-full object-contain select-none" draggable="false" alt="">
    `;

    const img = $("img", box);

    const clampPan = (x, y, s) => {
      const maxX = Math.max(
        0,
        (img.clientWidth * s - window.innerWidth) / 2
      );

      const maxY = Math.max(
        0,
        (img.clientHeight * s - window.innerHeight) / 2
      );

      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    };

    const apply = () => {
      img.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
      img.style.transition = dragging ? "none" : "transform 0.2s";
      img.style.cursor =
        scale > 1 ? (dragging ? "grabbing" : "grab") : "default";
      img.style.touchAction = scale > 1 ? "none" : "auto";
    };

    const show = (i) => {
      index = (i + images.length) % images.length;
      scale = 1;
      pan = { x: 0, y: 0 };

      img.src = images[index].src;
      img.alt = `Gallery ${index + 1}`;

      $("[data-counter]", box).textContent =
        `${index + 1} / ${images.length}`;

      apply();
    };

    const close = () => {
      document.removeEventListener("keydown", onKey);
      box.remove();
      document.body.style.overflow = prevOverflow;
      autoplay.play();
    };

    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    };

    box.addEventListener("click", close);

    $("[data-tools]", box).addEventListener("click", (e) =>
      e.stopPropagation()
    );

    $("[data-close]", box).addEventListener("click", close);

    $("[data-in]", box).addEventListener("click", () => {
      scale = Math.min(scale + 0.5, 3);
      pan = clampPan(pan.x, pan.y, scale);
      apply();
    });

    $("[data-out]", box).addEventListener("click", () => {
      scale = Math.max(scale - 0.5, 1);
      pan =
        scale === 1
          ? { x: 0, y: 0 }
          : clampPan(pan.x, pan.y, scale);
      apply();
    });

    $("[data-prev]", box).addEventListener("click", (e) => {
      e.stopPropagation();
      show(index - 1);
    });

    $("[data-next]", box).addEventListener("click", (e) => {
      e.stopPropagation();
      show(index + 1);
    });

    img.addEventListener("click", (e) => e.stopPropagation());

    img.addEventListener("pointerdown", (e) => {
      if (scale <= 1) return;

      dragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      panStart = pan;

      img.setPointerCapture(e.pointerId);
    });

    img.addEventListener("pointermove", (e) => {
      if (!dragging) return;

      pan = clampPan(
        panStart.x + e.clientX - dragStart.x,
        panStart.y + e.clientY - dragStart.y,
        scale
      );

      apply();
    });

    const stopDrag = () => {
      dragging = false;
      apply();
    };

    img.addEventListener("pointerup", stopDrag);
    img.addEventListener("pointercancel", stopDrag);

    document.addEventListener("keydown", onKey);

    show(index);
    document.body.appendChild(box);
  }
}
