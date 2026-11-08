async function initApp() {
  const params = config.getParams();
  state.slug = params.slug;
  state.urlTo = params.to;

  // Link /<slug>/<pin>: simpan PIN ke cookie lalu rapikan URL jadi /<slug> (feature/preload di Next)
  if (params.urlPin) {
    config.writePinCookie(state.slug, params.urlPin);
    history.replaceState(null, "", `/${encodeURIComponent(state.slug)}`);
    state.urlTo = "";
  }
  state.pin = config.readPinCookie(state.slug);

  const data = await loadEvent(state.slug, state.pin);
  if (!data) {
    $("#sectionLoading").remove();
    $("#notFound").classList.remove("hidden");
    return;
  }
  state.data = data;

  // Undangan private tanpa PIN -> halaman private
  if (data.dataEvent.eventAccess === 0 && !state.pin) {
    goPrivate();
    return;
  }
  // ?to= diabaikan bila tamu sudah punya PIN (app/[id]/page.tsx)
  if (state.urlTo && state.pin) {
    history.replaceState(null, "", `/${encodeURIComponent(state.slug)}`);
    state.urlTo = "";
  }

  if (state.pin) {
    const guestRes = await api.getCurrentGuest(state.slug, state.pin);
    if (guestRes.status === 200 && guestRes.data) {
      state.guest = guestRes.data;
    } else if (guestRes.status === 204) {
      // PIN tidak terdaftar: hapus cookie, tamu ke halaman private. Error jaringan tidak menghapus PIN.
      config.clearPinCookie(state.slug);
      goPrivate();
      return;
    }
  }

  // Preloader menunggu semua gambar (seperti usePreloader)
  await preloadImages(mediaUrlsToPreload());

  renderStatic();
  setupMenu();
  setupHero();
  setupBackgroundVideo();
  setupAudio();
  setupWishes();
  window.FhRsvp.init({ data: state.data, pin: state.pin, guest: state.guest, paramUrl: state.urlTo });

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  $("#sectionLoading").remove();

  //setupDresscode(state.guest);


  setupGallery();
  setupLocation(state.data.dataVenue);
  console.log('state', state.data.dataVenue);
  setupInvitationPopup();
  $("#siteBackground")?.classList.add("is-ready");
  observeAnimations();
  initAnimations();
}

window.WeddingApp.init = initApp;
