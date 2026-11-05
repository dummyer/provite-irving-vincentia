// ---------- render teks & gambar ----------
function coupleName() {
  const ev = state.data.dataEvent;
  //console.log('ev', ev);
  const groomName = ev.groomName || "Irving";
  return `${groomName}  &  Nathania`;
}

function renderStatic() {
  const d = state.data;
  const ev = d.dataEvent;
  const c = d.dataContent;

  console.log(ev);

  document.title = `${ev.name} - Provite`;

  // Couple Name
  $$('[data-bind="coupleName"]').forEach((n) => {
    n.textContent = coupleName();
  });

  // Popup undangan
  $("#popupGuestName").textContent = guestDisplayName() || "[Guest Name]";

  const popupCoupleName = $("#popupCoupleName");
  if (popupCoupleName) {
    popupCoupleName.textContent = coupleName();
  }

  if (c.popUpIconImageData?.url) {
    $("#popupImage").src = media(c.popUpIconImageData.url);
  } else if (c.bannerImageData?.url) {
    $("#popupImage").src = media(c.bannerImageData.url);
  }

  // Hero
  if (c.iconImageData?.url) {
    $("#heroLogo").src = media(c.iconImageData.url, 1140);
  }

  const hd = $("#heroDate");
  const pd = $("#popupDate");
  const hashtag = $("#heroHashtag");

  const m = d.date && d.date !== ""
    ? moment(d.date)
    : moment("2026-11-28");

  const day = m.format("D");
  const suffix = m.format("Do").replace(day, "");
  const fullDate = `${day}<sup>${suffix}</sup> ${m.format("MMMM YYYY")}`;

  if (hd) {
    hd.innerHTML = fullDate;
  }

  if (pd) {
    pd.innerHTML = fullDate;
  }

  if (hashtag && ev.hashTag?.trim()) {
    const tag = ev.hashTag.trim();
    hashtag.innerHTML = tag.startsWith("#") ? tag : "#" + tag;
  }

  renderProfile();
  renderCountdown();
  //renderGifts();
}
