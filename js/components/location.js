// Component module: classic script, shares app.js globals.
// Location.tsx
async function renderLocation() {
  const d = state.data;
  let guestSessions = [];
  if (state.pin) {
    const res = await api.getGuestSessionsByPin(state.pin, d.dataEvent.id);
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) guestSessions = res.data;
  }

  const firstSession = d.dataSession?.[0];
  const rawVenueName = firstSession?.addressName || d.dataEvent?.venueName || "Pullman Grand Central\nBandung";
  $("#venueNameMobile").textContent = rawVenueName.includes("\n")
    ? rawVenueName
    : rawVenueName.replace(/Pullman Grand Central Bandung/i, "Pullman Grand Central\nBandung");
  $("#venueNameDesktop").textContent = rawVenueName.replace("\n", " ").trim();
  $("#venueAddress").textContent = firstSession?.address || d.dataEvent?.venueAddress || "JL. Diponegoro No.27 Bandung";
  $("#mapsLink").href = firstSession?.mapUrl || firstSession?.googleMapUrl || d.dataEvent?.mapsUrl || "https://maps.google.com/?q=Pullman+Grand+Central+Bandung";
  if (d.dataContent?.venueImageData?.url) $("#venueImage").src = media(d.dataContent.venueImageData.url);

  let rawSessions = [];
  if (guestSessions.length > 0) {
    rawSessions = guestSessions;
  } else if (d.dataSession?.length > 0) {
    rawSessions = d.dataEvent?.publicSessionLayout
      ? d.dataSession.filter((s) => d.dataEvent.publicSessionLayout.split(",").includes(s.id))
      : d.dataSession;
  }
  const sessions = rawSessions.length > 0
    ? rawSessions.map((s) => ({ name: (s.name || "SESSION").toUpperCase(), time: s.date ? `${moment(s.date).format("HH.mm")} WIB` : "12.00 WIB" }))
    : [{ name: "HOLY MATRIMONY", time: "12.00 WIB" }, { name: "WEDDING RECEPTION", time: "18.00 WIB" }];

  const list = $("#sessionList");
  list.innerHTML = "";
  sessions.forEach((session, index) => {
    const isLast = index === sessions.length - 1;
    const wrap = el("div", "text-center animate");
    wrap.dataset.animate = "fade-up";
    const h4 = el("h4", "font-trajanpro font-bold text-center text-white mb-[15px] md:mb-[25px] uppercase tracking-wide px-4 text-[16px] md:text-[20px] leading-[18px] md:leading-[24px]", session.name);
    h4.style.cssText = "font-family: 'Trajan Pro', serif; font-style: normal; font-weight: 700; text-align: center; color: #FFFFFF;";
    const p = el("p", `font-trajanpro font-normal text-center text-white uppercase tracking-wide text-[14px] md:text-[18px] leading-[20px] md:leading-[22px] ${isLast ? "mb-[80px] md:mb-[100px]" : "mb-[25px] md:mb-[30px]"}`, session.time);
    p.style.cssText = "font-family: 'Trajan Pro', serif; font-style: normal; font-weight: 400; text-align: center; color: #FFFFFF;";
    wrap.append(h4, p);
    list.appendChild(wrap);
  });
  observeAnimations(list);
}

