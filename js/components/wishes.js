// Component module: classic script, shares app.js globals.
// ---------- ucapan (Wishes.tsx) ----------

const wishes = {
  all: [],
  filtered: [],
};

async function loadWishes() {
  const eventId = state.data.dataContent.eventId;
  if (!eventId) return;

  const res = await api.getAllPMG(eventId);

  wishes.all = res.ok && Array.isArray(res.data) ? res.data : [];

  filterWishes($("#wishSearch")?.value ?? "");
  renderWishList();
}

function filterWishes(search) {
  const q = search.trim().toLowerCase();

  wishes.filtered = q === ""
    ? wishes.all
    : wishes.all.filter((w) =>
        (w.name || w.Name || "").toLowerCase().includes(q) ||
        (w.guestName || "").toLowerCase().includes(q) ||
        (w.message || w.Message || "").toLowerCase().includes(q)
      );
}


// =========================================
// COMPACT WISH LIST
// =========================================

function renderWishList() {
  const list = $("#wishList");
  if (!list) return;

  list.innerHTML = "";

  // 20 pesan pertama
  const items = wishes.all.slice(0, 20);

  if (items.length === 0) {
    const p = el(
      "p",
      "wish-empty my-auto",
      "No message yet"
    );

    list.appendChild(p);
    return;
  }

  items.forEach((w, i) => {
    const item = el("div", "w-full text-left");

    const name = el(
      "p",
      "wish-name mb-2",
      decodeText(w.name || w.Name)
    );

    const msg = el(
      "p",
      "wish-message mb-2",
      decodeText(w.message || w.Message)
    );

    item.append(name, msg);

    if (i < items.length - 1) {
      item.appendChild(
        el(
          "div",
          "w-full border-b-[0.488543px] border-[#FFFFFF] mb-[6.97px]"
        )
      );
    }

    list.appendChild(item);
  });
}


// =========================================
// ALL WISHES GRID
// =========================================

function renderWishGrid() {
  const grid = $("#wishGrid");
  if (!grid) return;

  grid.innerHTML = "";

  $("#wishGridEmpty")?.classList.toggle(
    "hidden",
    wishes.filtered.length > 0
  );

  grid.classList.toggle(
    "hidden",
    wishes.filtered.length === 0
  );

  wishes.filtered.forEach((w) => {
    const nameStr = decodeText(w.name || w.Name || "");

    const initials = nameStr
      .split(" ")
      .filter(Boolean)
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const card = el(
      "div",
      "group relative overflow-hidden rounded-[10px] border border-[#5F2D1C]/30 bg-[#F8F6EF] shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-[box-shadow,border-color] duration-300 text-left min-h-[125px] max-h-[148px]"
    );

    card.innerHTML = `
      <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#5F2D1C]/70 via-[#5F2D1C]/30 to-transparent"></div>

      <div class="p-[10px] flex-1 flex flex-col justify-between">
        <p class="wish-grid-quote">&quot;</p>

        <p
          class="wish-grid-message mb-2 line-clamp-3"
          data-f="msg"
        ></p>

        <div class="w-8 h-[1px] bg-[#5F2D1C]/30 rounded-full"></div>
      </div>

      <div class="bg-[#F0EBDD] px-[10px] py-[6px] flex items-center gap-[8px] border-t border-[#DED8C9]">

        <div class="w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center shrink-0 border border-[#5F2D1C]/20">
          <p
            class="wish-grid-initials"
            data-f="initials"
          ></p>
        </div>

        <p
          class="wish-grid-name truncate flex-1"
          data-f="name"
        ></p>

      </div>
    `;

    $('[data-f="msg"]', card).textContent = decodeText(
      w.message || w.Message
    );

    $('[data-f="initials"]', card).textContent = initials || "?";

    $('[data-f="name"]', card).textContent = nameStr;

    card.addEventListener("click", () => openWishModal(w));

    grid.appendChild(card);
  });
}


// =========================================
// WISH MODAL
// =========================================

function openWishModal(w) {
  const overlay = el(
    "div",
    "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
  );

  overlay.innerHTML = `
    <div class="relative w-[320px] max-w-full bg-[#F5F1EA] p-6 rounded-[14px] border border-[#5F2D1C] shadow-xl text-center">

      <h3
        class="wish-modal-name mb-3"
        data-f="name"
      ></h3>

      <div class="w-12 h-[1px] bg-[#5F2D1C]/30 mx-auto mb-4"></div>

      <p
        class="wish-modal-message mb-6 max-h-[200px] overflow-y-auto wishes-scrollbar"
        data-f="msg"
      ></p>

      <button
        type="button"
        class="wish-modal-close w-full h-[32px] rounded-[8px] bg-[#5F2D1C] text-white cursor-pointer hover:opacity-90 transition-opacity"
      >
        CLOSE
      </button>

    </div>
  `;

  $('[data-f="name"]', overlay).textContent = decodeText(
    w.name || w.Name || ""
  );

  $('[data-f="msg"]', overlay).textContent = decodeText(
    w.message || w.Message || ""
  );

  $("button", overlay).addEventListener("click", () => {
    overlay.remove();
  });

  $("#modalRoot")?.appendChild(overlay);
}


// =========================================
// SETUP WISHES
// =========================================

function setupWishes() {
  const form = $("#wishForm");
  if (!form) return;

  const guestName = state.guest?.name ?? state.urlTo ?? "";

  if (guestName && form.elements.name) {
    form.elements.name.value = guestName;
  }

  let submitting = false;

  // Submit wish
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.elements.name.value.trim() || guestName;
    const message = form.elements.message.value.trim();

    if (submitting) return;

    if (!name || !message) {
      Swal.fire({
        text: "Name and message are required.",
        icon: "warning",
        confirmButtonColor: "#5F2D1C",
      });

      return;
    }

    submitting = true;

    const submitBtn = $("#wishSubmit");

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    const res = await api.submitPMG({
      eventId: state.data.dataContent.eventId ?? "",
      mediaFileId: null,
      name,
      message,
      status: 1,
      type: 1,
    });

    if (res.ok) {
      Swal.fire({
        title: "Success",
        text: "Message successfully sent. Message will be checked first before being displayed.",
        icon: "success",
        confirmButtonColor: "#5F2D1C",
      });

      form.elements.message.value = "";
      form.elements.name.value = name;

      loadWishes();
    } else {
      Swal.fire({
        title: "Error",
        text: res.data?.message || "Something went wrong",
        icon: "error",
        confirmButtonColor: "#5F2D1C",
      });
    }

    submitting = false;

    if (submitBtn) {
      submitBtn.disabled = false;
    }
  });


  // Toggle compact list <-> all messages
  let showAll = false;

  $("#wishViewAll")?.addEventListener("click", () => {
    showAll = !showAll;

    $("#wishListWrap")?.classList.toggle("hidden", showAll);
    $("#wishAllWrap")?.classList.toggle("hidden", !showAll);

    const label = $("#wishViewAllLabel");

    if (label) {
      label.textContent = showAll
        ? "BACK"
        : "SEE ALL MESSAGES";
    }

    if (showAll) {
      const search = $("#wishSearch");

      if (search) {
        search.value = "";
      }

      filterWishes("");
      renderWishGrid();
    }
  });


  // Search with debounce
  let searchTimer = null;

  $("#wishSearch")?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);

    const val = e.target.value;

    searchTimer = setTimeout(() => {
      filterWishes(val);
      renderWishGrid();
    }, 500);
  });


  // Initial load
  loadWishes();
}
