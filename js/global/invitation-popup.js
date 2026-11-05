// ---------- buka undangan ----------
function openInvitation() {
  if (state.isOpen) return;
  state.isOpen = true;
  $("#invitationPopup").classList.add("hidden");
  $("#popupBackdrop")?.classList.add("hidden");
  $("#content").classList.remove("blur-background");
  $$(".hidden-until-open").forEach((n) => n.classList.remove("hidden-until-open"));
  document.body.style.overflow = "auto";

  const floating = $("#floatingButtons");
  floating.classList.remove("opacity-0", "pointer-events-none");
  floating.classList.add("opacity-100", "pointer-events-auto");

  setupRsvpButton(true);
  observeAnimations();
  initAnimations();
}

function setupInvitationPopup() {

  $("#popupBackdrop")?.classList.remove("hidden");
  $("#invitationPopup").classList.remove("hidden");
  $("#btnViewInvitation").addEventListener("click", () => {
    playMusic();
    playBackgroundVideo();
    // const v = $("#backgroundVideo");
    // const box = document.createElement("div");
    // box.style.cssText = "position:fixed;top:90px;left:8px;z-index:99999;background:#000c;color:#0f0;font:11px monospace;padding:6px;white-space:pre-wrap;max-width:90vw;pointer-events:none";
    // document.body.appendChild(box);

    // const ev = [];
    // ["pause", "waiting", "stalled", "suspend", "ended", "emptied", "abort", "error", "playing"]
    //   .forEach((n) => v.addEventListener(n, () => ev.push(n)));

    // setInterval(() => {
    //   box.textContent =
    //     "t=" + v.currentTime.toFixed(2) +
    //     " paused=" + v.paused +
    //     " ready=" + v.readyState +
    //     " net=" + v.networkState +
    //     "\n" + ev.slice(-6).join(" > ");
    // }, 200);

    openInvitation();


    if (state.pin) api.submitOpenInvitation(state.data.dataEvent.id, state.pin);
  });
}
