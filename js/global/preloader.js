// ---------- preloader (hooks/preLoader.ts + Loader/SectionLoading.tsx) ----------
function preloadImages(urls) {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const total = unique.length;
  let count = 0;

  const bar = $("#loadingBar");
  const percent = $("#loadingPercent");

  const update = () => {
    const p = total === 0 ? 100 : Math.round((count / total) * 100);
    if (bar) bar.style.width = `${p}%`;
    if (percent) percent.textContent = `${p}%`;
  };

  update();
  if (total === 0) return Promise.resolve();

  return Promise.all(unique.map((src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => { count++; update(); resolve(); };
    img.src = src;
  })));
}

function mediaUrlsToPreload() {
  const c = state.data.dataContent;
  const gallery = (c.galleryImageData ?? []).map((item) => (item?.url ? media(item.url) : null));
  const dynamic = [
    c.iconImageData?.url ? media(c.iconImageData.url, 1140) : null,
    c.popUpIconImageData?.url ? media(c.popUpIconImageData.url) : null,
    c.bannerImageData?.url ? media(c.bannerImageData.url) : null,
    c.groomPhoto?.url ? media(c.groomPhoto.url) : null,
    c.bridePhoto?.url ? media(c.bridePhoto.url) : null,
    c.venueImageData?.url ? media(c.venueImageData.url) : null,
    c.rsvpPhoto?.url ? media(c.rsvpPhoto.url) : null,
    c.dresscodePhoto?.url ? media(c.dresscodePhoto.url) : null,
  ];
  return [...TEMPLATE_ASSETS, ...gallery, ...dynamic];
}

