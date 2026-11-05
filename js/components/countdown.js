// Component module: classic script, shares app.js globals.
function renderCountdown() {
  const d = state.data || {};
  let target = "2026-11-28T00:00:00";
  if (d.date && d.date !== "") {
    target = new Date(d.date).toISOString();
  } else if (d.dataSession?.length > 0) {
    d.dataSession.forEach((item) => {
      if (item.setCountTimer === true) target = new Date(item.date).toISOString();
    });
  }

  const dateEl = $("#countdownDate");

  if (dateEl) {
    const m = d.date && d.date !== ""
      ? moment(d.date)
      : moment("2026-11-28");

    const dayEl = dateEl.querySelector(".countdown-day");
    const dateTextEl = dateEl.querySelector(".countdown-date");

    if (dayEl) {
      dayEl.textContent = m.format("dddd")+', ';
    }

    if (dateTextEl) {
      const day = m.format("D");
      const suffix = "th";
      const monthYear = m.format("MMMM YYYY");

      dateTextEl.innerHTML =
        `${day}<sup class="hidden">${suffix}</sup> ${monthYear}`;
    }
  }

  const values = {
    Days: $("#countdown-days"),
    Hours: $("#countdown-hours"),
    Minutes: $("#countdown-minutes"),
    Seconds: $("#countdown-seconds"),
  };

  const targetTime = new Date(target).getTime();
  const pad = (v) => (v < 10 ? `0${v}` : `${v}`);
  const tick = () => {
    const diff = targetTime - Date.now();
    const parts = diff <= 0 ? [0, 0, 0, 0] : [
      Math.floor(diff / 86400000),
      Math.floor((diff % 86400000) / 3600000),
      Math.floor((diff % 3600000) / 60000),
      Math.floor((diff % 60000) / 1000),
    ];
    ["Days", "Hours", "Minutes", "Seconds"].forEach((k, i) => {
      if (values[k]) values[k].textContent = pad(parts[i]);
    });
  };
  tick();
  setInterval(tick, 1000);


  //
  const calendarBtn = $("#countdown-calendar");

  if (calendarBtn) {
    const eventDate = d.date && d.date !== ""
      ? moment(d.date)
      : moment("2026-11-28");

    const eventTitle = d?.dataEvent?.name || "";

    calendarBtn.href =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(eventTitle)}` +
      `&dates=${eventDate.format("YYYYMMDD")}/${eventDate.clone().add(1, "day").format("YYYYMMDD")}` +
      `&details=${encodeURIComponent("Join us to celebrate " + eventTitle + "!")}`;

    calendarBtn.target = "_blank";
    calendarBtn.rel = "noopener noreferrer";
  }
}
