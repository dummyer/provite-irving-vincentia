// Component module: classic script, shares app.js globals.
// ---------- menu (Menu.tsx) ----------
let menuOpen = false;
let lockedScrollY = 0;

// useLockBodyScroll.ts
function lockBodyScroll(lock) {
  const html = document.documentElement;
  const body = document.body;
  if (lock) {
    lockedScrollY = window.scrollY;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  } else {
    html.style.overflow = "";
    body.style.overflow = "";
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  }
}

function scrollToSection(href) {
  const target = document.getElementById(href.replace("#", ""));
  if (!target) return;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
}

function setupMenu() {
  const panelList = $("#menuPanelList");
  const nav = $("#desktopNav");

  MENU_ITEMS.forEach((item, i) => {
    const row = el("div", "menu-item-row h-[36px] md:h-[44px] flex items-start");
    row.style.animationDelay = `${0.1 + i * 0.06}s`;
    const a = el("a", "menu_text flex items-center hover");
    a.href = item.href;
    a.innerHTML = `<span class="menu-arrow"><svg width="14" height="10" viewBox="0 0 14 10" fill="none" class="shrink-0"><path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>`;
    a.appendChild(document.createTextNode(item.label));
    a.addEventListener("click", (e) => {
      e.preventDefault();
      a.classList.add("is-active");
      // tunggu animasi panah (220ms), tutup panel, lalu scroll
      setTimeout(() => {
        closeMenu();
        setTimeout(() => scrollToSection(item.href), 50);
      }, 220);
    });
    row.appendChild(a);
    panelList.appendChild(row);

    const d = el("a", "desktop_nav_text hover", item.label);
    d.href = item.href;
    d.addEventListener("click", (e) => { e.preventDefault(); scrollToSection(item.href); });
    nav.appendChild(d);
  });
  const info = el("p", "menu-item-row menu_info mt-[20px]", "Select a section above to continue");
  info.style.animationDelay = `${0.1 + MENU_ITEMS.length * 0.06}s`;
  panelList.appendChild(info);

  $("#burger").addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

  // useScrollVisible: navbar desktop tampil saat di atas / scroll ke atas, hilang saat scroll ke bawah atau diam 2 detik
  let lastY = 0;
  let idleTimer = null;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y <= 50) {
        nav.classList.remove("is-hidden");
        clearTimeout(idleTimer);
      } else if (y < lastY) {
        nav.classList.remove("is-hidden");
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => nav.classList.add("is-hidden"), 2000);
      } else {
        nav.classList.add("is-hidden");
        clearTimeout(idleTimer);
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
}

function openMenu() {
  menuOpen = true;
  $("#burger").classList.add("is-open");
  $("#burger").setAttribute("aria-label", "Close menu");
  $$(".menu_text", $("#menuPanelList")).forEach((a) => a.classList.remove("is-active"));
  const panel = $("#menuPanel");
  panel.classList.remove("hidden", "is-closing");
  $$(".menu-item-row", panel).forEach((r) => { r.style.animation = "none"; void r.offsetWidth; r.style.animation = ""; });
  lockBodyScroll(true);
}

function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  $("#burger").classList.remove("is-open");
  $("#burger").setAttribute("aria-label", "Open menu");
  const panel = $("#menuPanel");
  panel.classList.add("is-closing");
  lockBodyScroll(false);
  setTimeout(() => { if (!menuOpen) panel.classList.add("hidden"); }, 450);
}

