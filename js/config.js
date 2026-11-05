window.TWINKLE_CONFIG = {
  API_BASE_URL: "https://api.twinklebook.com",
  MEDIA_BASE_URL: "https://media.twinklebook.com/",
  FALLBACK_SLUG: "irvingvincentia",

  // Video hero bawaan template (relatif ke <base>)
  DEFAULT_VIDEO: "assets/videos/hero_video.mp4",

  // Guest PIN cookie, sama dengan lib/guestPin.ts di Next (`tb-pin-<slug>`, 30 hari).
  PIN_COOKIE_MAX_AGE: 60 * 60 * 24 * 30,

  pinCookieName: function (slug) {
    return "tb-pin-" + String(slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  },

  isValidPin: function (pin) {
    return typeof pin === "string" && /^\d{1,10}$/.test(pin.trim());
  },

  readPinCookie: function (slug) {
    try {
      const name = this.pinCookieName(slug) + "=";
      const entry = document.cookie.split("; ").find((c) => c.startsWith(name));
      if (!entry) return "";
      const value = decodeURIComponent(entry.substring(name.length)).trim();
      return this.isValidPin(value) ? value : "";
    } catch (e) {
      return "";
    }
  },

  writePinCookie: function (slug, pin) {
    if (!this.isValidPin(pin)) return;
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${this.pinCookieName(slug)}=${pin.trim()}; Max-Age=${this.PIN_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    } catch (e) {
      // cookie diblok, abaikan
    }
  },

  clearPinCookie: function (slug) {
    try {
      document.cookie = `${this.pinCookieName(slug)}=; Max-Age=0; Path=/; SameSite=Lax`;
    } catch (e) {
      // abaikan
    }
  },

  // URL: <base>/<slug>, <base>/<slug>/<pin>, atau ?id=<slug>&pin=<pin>.
  // Pathname dipotong dulu pakai APP_BASE supaya segmen base tidak dianggap slug.
  getParams: function () {
    const params = new URLSearchParams(window.location.search);

    let path = window.location.pathname;
    const base = window.APP_BASE || "/";
    if (base !== "/" && path.startsWith(base)) path = path.slice(base.length);
    const parts = path.split("/").filter((p) => p && !p.includes(".html"));

    const slug = params.get("id") || params.get("url") || parts[0] || this.FALLBACK_SLUG;
    const urlPin = params.get("pin") || (this.isValidPin(parts[1] || "") ? parts[1] : "");

    return {
      slug,
      urlPin,
      to: params.get("to") || "",
      group: params.get("group") || "",
    };
  },
};
