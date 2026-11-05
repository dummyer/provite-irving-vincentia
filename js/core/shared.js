// Shared globals for classic scripts (no bundler required).
window.WeddingApp = window.WeddingApp || {};
const config = window.TWINKLE_CONFIG;
const api = window.TwinkleAPI;
const MEDIA = config.MEDIA_BASE_URL;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const TEMPLATE_ASSETS = [
  "hero_img.webp",
  "bg_bg.webp",
  window.matchMedia("(min-width: 1024px)").matches
    ? "hero_desktop_bg_motif.webp"
    : "rsvp_bg_motif.webp?v=1272",
].map((f) => `assets/images/${f}`).concat(["assets/icons/ic-chair.webp"]);

const MENU_ITEMS = [
  { label: "Home", href: "#hero" }, { label: "Profile", href: "#profile" },
  { label: "Counting Down", href: "#counting-down" }, { label: "Event Detail", href: "#location" },
  { label: "RSVP", href: "#reservation" }, { label: "Gallery", href: "#gallery" }, { label: "Wishes", href: "#wishes" },
];
const DEFAULT_GIFTS = [
  { bankName: "BCA", accountNumber: "00000000", accountName: "Provite" },
];
const state = { slug: "", pin: "", urlTo: "", data: null, guest: null, isOpen: false };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const media = (url, width) => url ? `${MEDIA}${url}${width ? `?width=${width}` : ""}` : "";
function decodeText(str) {
  const t = document.createElement("textarea");
  t.innerHTML = String(str ?? "").replace(/&amp;(#\d+;)/g, "&$1");
  return t.value;
}
function guestDisplayName() {
  return state.guest?.name ?? (state.urlTo ? state.urlTo : "");
}
