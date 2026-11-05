(async function loadWeddingPartials() {
  const mountTop = document.getElementById("appShellTop");
  const mount = document.getElementById("appShell");
  if (!mount || !mountTop) throw new Error("Missing #appShellTop / #appShell mount element");

  const topPartials = [
    "../partials/loading.html",
    "../partials/not-found.html",
    "../partials/invitation-popup.html",
    "../partials/menu.html",
    "../partials/floating-buttons.html",
    "../partials/modal-root.html",
  ];

  const bodyPartials = [
    "../partials/components/hero.html",
    "../partials/components/separator.html",
    "../partials/components/profile.html",
    "../partials/components/countdown.html",
    "../partials/components/venue.html",
    "../partials/components/gallery.html",
    "../partials/components/rsvp.html",
    "../partials/components/image.html",
    "../partials/components/wish.html",
    "../partials/components/footer.html",
  ];

  // Path partial & asset ditulis relatif ke file lama; di-rewrite supaya ikut <base>
  const fixPath = (url) => url.replace("../partials/", "partials/");
  const fixHtml = (html) => html.replaceAll("../../assets/", "assets/");

  const load = (list) => Promise.all(list.map(async (url) => {
    const response = await fetch(fixPath(url));
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return fixHtml(await response.text());
  }));

  try {
    const [topHtml, bodyHtml] = await Promise.all([load(topPartials), load(bodyPartials)]);
    mountTop.innerHTML = topHtml.join("\n");
    mount.innerHTML = bodyHtml.join("\n");
    document.dispatchEvent(new CustomEvent("wedding:partials-loaded"));
  } catch (error) {
    console.error("Failed to load wedding HTML partials:", error);
    mount.innerHTML = '<p style="padding:2rem;color:#4F0806">Gagal memuat komponen undangan. Periksa path folder partials.</p>';
  }
})();
