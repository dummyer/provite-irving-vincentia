const PROFILE_DEFAULTS = {
  dataEvent: {
    groomFullName: "Irving Gregorius Mananta",
    brideFullName: "Vincentia Nathania",
    groomFather: "Mr. Blasius Hendra Mananta",
    groomMother: "Mrs. Bernadeth Sherly Yulihin (†)",
    brideFather: "Mr. Rudy Limanto",
    brideMother: "Mrs. Maria Halimi",
    groomChildLabel: "First Son of",
    brideChildLabel: "First Daughter of",
    groomInstagram: "irving",
    brideInstagram: "vincentia",
  },
};

// "A and B" / "A & B" / "A dan B" -> ["A", "B"]
function splitParents(str) {
  return (str || "")
    .split(/\s+(?:and|&|dan)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderProfile() {
  const ev = state.data?.dataEvent || {};
  const D = PROFILE_DEFAULTS.dataEvent;

  const setText = (sel, text, root) => {
    if (root === null) return;
    const node = $(sel, root);
    if (node) node.textContent = text;
  };
  const setHref = (sel, href) => {
    const node = $(sel);
    if (node) node.href = href;
  };
  const setSrc = (sel, src) => {
    const node = $(sel);
    if (node) node.src = src;
  };

  // Mobile stacks parent names; desktop can keep them on one line with a separator.
  const setParents = (sel, names, inline = false) => {
    const node = $(sel);
    if (!node) return;
    node.textContent = "";
    if (names.length === 0) return;
    if (names.length === 1) {
      node.textContent = names[0];
      return;
    }
    if (inline) node.append(names[0], " and ", names[1]);
    else node.append(names[0], document.createElement("br"), names[1]);
  };

  //console.log("event", ev);

  // ---------- Groom name ----------
  const rawGroomName = ev.groomFullName || ev.groomName || D.groomFullName;
  const normalizedGroom = rawGroomName.replace("\n", " ").trim();
  const groomNameParts = normalizedGroom.split(/\s+/).filter(Boolean);
  const groomNameLines = groomNameParts.length > 2
    ? [`${groomNameParts.slice(0, -1).join(" ")}`, groomNameParts.at(-1)]
    : groomNameParts.length > 1
      ? [groomNameParts[0], groomNameParts.slice(1).join(" ")]
      : groomNameParts;
  const groomNameMobile = groomNameLines.join("\n");
  const groomNameDesktop = groomNameMobile;

  const mobile = $("#groomNameMobile");
  if (mobile) {
    mobile.textContent = "";
    groomNameMobile.split("\n").forEach((line, idx) =>
      mobile.appendChild(el("span", idx === 0 ? "relative -top-2 block whitespace-nowrap" : "relative -top-2 block", line))
    );
  }
  const desktop = $("#groomNameDesktop");
  if (desktop) {
    desktop.textContent = "";
    groomNameDesktop.split("\n").forEach((line) =>
      desktop.appendChild(
        el(
          "span",
          "relative -top-4 block whitespace-nowrap",
          line
        )
      )
    );
  }

  // ---------- Parents (mobile & desktop sama) ----------
  const groomParentsList = splitParents(ev.groomParent);
  const brideParentsList = splitParents(ev.brideParent);

  const groomParents = groomParentsList.length
    ? groomParentsList
    : [D.groomFather, D.groomMother];
  const brideParents = brideParentsList.length
    ? brideParentsList
    : [D.brideFather, D.brideMother];

  setParents("#groomParentsMobile", groomParents);
  setParents("#groomParentsDesktop", groomParents, true);
  setParents("#brideParentsMobile", brideParents);
  setParents("#brideParentsDesktop", brideParents, true);
  setText("#groomChildLabel", D.groomChildLabel);
  setText("#brideChildLabel", D.brideChildLabel);

  // ---------- Instagram ----------
  const groomInstagram = ev.groomInstagram || D.groomInstagram;
  const brideInstagram = ev.brideInstagram || D.brideInstagram;
  setHref("#groomInstagram", `https://instagram.com/${groomInstagram.replace("@", "")}`);
  setText('[data-f="handle"]', groomInstagram, $("#groomInstagram"));
  setHref("#brideInstagram", `https://instagram.com/${brideInstagram.replace("@", "")}`);
  setText('[data-f="handle"]', brideInstagram, $("#brideInstagram"));

  // ---------- Bride name & photos ----------
  setText("#brideName", ev.brideFullName || ev.brideName || D.brideFullName);
  setSrc("#groomPhoto", "assets/images/profile_groom.webp");
  setSrc("#bridePhoto", "assets/images/profile_bride.webp");
  const groomPhoto = $("#groomPhoto");
  const bridePhoto = $("#bridePhoto");
  if (groomPhoto) groomPhoto.alt = rawGroomName;
  if (bridePhoto) bridePhoto.alt = ev.brideFullName || ev.brideName || D.brideFullName;
}
