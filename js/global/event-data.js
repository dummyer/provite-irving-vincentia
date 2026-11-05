// ---------- data ----------
async function loadEvent(slug, pin) {
  const eventRes = await api.getCurrentEvent(slug);
  const event = eventRes.data;
  if (!eventRes.ok || !event || !event.id || event.status === "Error") return null;

  const lang = event.contentLanguage === "en" ? 1 : 0;
  
  const [contentRes, sessionRes, venueRes] = await Promise.all([
    api.getEventContentByLang(event.id, lang),
    api.getEventSessionRSVP(event.id),
    api.getGuestSessionsByPin(pin, event.id), // urutan: (pin, eventId)
  ]);

  // Bentuk data sama dengan hooks/useEventUrl.ts
  return {
    url: slug,
    InvitationWAUrl: event.invitationWAUrl,
    date: event.date,
    dataContent: contentRes.data || {},
    dataEvent: event,
    dataSession: Array.isArray(sessionRes.data) ? sessionRes.data : [],
    dataVenue: Array.isArray(venueRes.data) ? venueRes.data : [],
  };
}

function goPrivate() {
  window.location.href = `private.html?id=${encodeURIComponent(state.slug)}`;
}