// Location module: HTML (template) pegang struktur & style, JS cuma looping + isi data.

const defaultVenues = [
    {
        id: "holy-matrimony",
        keywords: ["gereja katedral jakarta", "katedral jakarta", "katedral"],
        image: "assets/images/venue_a.webp",
        addressName: "GEREJA KATEDRAL JAKARTA",
        address: "Jl. Katedral No. 7B,\nJakarta Pusat",
        hall: "",
        mapQuery: "Gereja Katedral Jakarta",
    },
    {
        id: "wedding-reception",
        keywords: ["double tree", "doubletree", "kemayoran"],
        image: "assets/images/venue_b.webp",
        addressName: "DOUBLE TREE BY HILTON\nJAKARTA KEMAYORAN",
        address: "Jl. Griya Utama No.1 Blok B, Sunter Agung,\nKec. Tj. Priok, Jakarta Utara",
        hall: "ANGSANA BALLROOM",
        mapQuery: "DoubleTree by Hilton Jakarta Kemayoran",
    },
];

const defaultLocationEvents = [
    {
        id: "default-holy",
        name: "HOLY MATRIMONY",
        date: "2026-12-05T09:00:00+07:00",
        address: "Jl. Katedral No. 7B,\nJakarta Pusat",
        addressName: "GEREJA KATEDRAL JAKARTA",
        latLong: "",
    },
    {
        id: "default-reception",
        name: "WEDDING RECEPTION",
        date: "2026-12-05T18:00:00+07:00",
        address: "Jl. Griya Utama No.1 Blok B, Sunter Agung,\nKec. Tj. Priok, Jakarta Utara",
        addressName: "DOUBLE TREE BY HILTON\nJAKARTA KEMAYORAN",
        latLong: "",
    },
];

function normalizeVenueText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function updateSeatedDinnerRsvp(events) {
    const element = document.getElementById("seated_dinner_rsvp");
    const element_dc = document.getElementById("dresscode");
    if (!element) return;
    if (!element_dc) return;

    const hasSeatedDinner = Array.isArray(events) &&
        events.some(event =>
            normalizeVenueText(event.name).includes("seated dinner reception")
        );

    element.classList.toggle("hidden", !hasSeatedDinner);
    element_dc.classList.toggle("hidden", !hasSeatedDinner);
}

// Cocok dengan helper -> pakai data helper (gambar, nama venue, alamat, hall).
// Tidak cocok -> pakai data API apa adanya (tanpa gambar).
function getLocationVenue(event) {
    const address = normalizeVenueText(event.address);
    const addressName = normalizeVenueText(event.addressName);

    const matched = defaultVenues.find((venue) =>
        venue.keywords.some((keyword) => {
            const normalizedKeyword = normalizeVenueText(keyword);
            return (
                address.includes(normalizedKeyword) ||
                addressName.includes(normalizedKeyword)
            );
        })
    );

    if (matched) return matched;

    return {
        id: `api-${event.id || normalizeVenueText(event.address || event.name)}`,
        image: "",
        addressName: event.addressName || "",
        address: event.address || "",
        hall: "",
        mapQuery: event.latLong || event.address || "",
    };
}

function formatLocationTime(dateValue) {
    if (!dateValue) return "";

    // API venue mengirim waktu lokal tanpa zona; pertahankan jam yang dikirim.
    const localDateTime = String(dateValue).match(
        /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/
    );
    if (localDateTime) return `${localDateTime[1]}.${localDateTime[2]} WIB`;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
    }).format(date) + " WIB";
}

function getLocationMapUrl(event, venue) {
    const query = [
        venue.addressName || event.addressName,
        venue.address || event.address,
    ].filter(Boolean).join(", ");

    if (!query) return "";

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Looping: clone <template> per event, isi lewat data-f.
function renderLocationEvents(events) {
    const container = document.getElementById("locationEvents");
    const tpl = document.getElementById("locationTemplate");
    if (!container || !tpl) return;

    container.replaceChildren();
    if (!Array.isArray(events) || events.length === 0) return;

    events.forEach((event, index) => {
        const venue = getLocationVenue(event);
        const node = tpl.content.cloneNode(true);
        if (index > 0) {
            const article = node.querySelector(".location-event");
            article?.classList.remove("mt-[30px]", "md:mt-[32px]");
            article?.classList.add("mt-[70px]", "md:mt-[70px]");
        }
        const f = (name) => node.querySelector(`[data-f="${name}"]`);

        const setText = (name, value) => {
            const el = f(name);
            if (!el) return;
            if (value) el.textContent = value;
            else el.remove(); // kosong -> buang elemennya
        };

        const img = f("image");
        if (img) {
            if (venue.image) img.src = venue.image;
            else img.remove();
        }

        setText("title", event.name || "Wedding Event");
        setText("time", formatLocationTime(event.date));
        setText("hall", venue.hall);
        setText("venue", venue.addressName);
        setText("address", venue.address);

        const map = f("map");
        if (map) {
            const url = getLocationMapUrl(event, venue);
            if (url) map.href = url;
            else map.remove();
        }

        container.appendChild(node);
    });
}

// Ambil daftar event dari API. Item tanpa address / addressName dibuang.
function getLocationApiEvents(data) {
    const list = Array.isArray(data) ? data : data?.dataVenue;
    if (!Array.isArray(list)) return null;

    const valid = list.filter((item) => item && (item.address || item.addressName));
    return valid.length > 0 ? valid : null;
}

function setupLocation(data = null) {
    // API jadi sumber utama; default dipakai kalau API kosong.
    const events = getLocationApiEvents(data) || defaultLocationEvents;
    //console.log("setupLocation", events);

    renderLocationEvents(events);
    updateSeatedDinnerRsvp(events);
}

function refreshLocationFromState() {
    if (typeof state !== "undefined" && state.data) {
        setupLocation(state.data);
    }
}

// Pemicu render: tunggu #locationEvents (partial) dan state.data (API).
let tries = 0;
const timer = setInterval(() => {
    tries++;
    const container = document.getElementById("locationEvents");
    const hasData = typeof state !== "undefined" && state.data;

    if (container && hasData) {
        setupLocation(state.data);
        clearInterval(timer);
    } else if (container && tries === 1) {
        setupLocation(); // default dulu sambil nunggu API
    }

    if (tries > 50) clearInterval(timer); // berhenti setelah ~10 detik
}, 200);
