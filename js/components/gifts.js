// Component module: classic script, shares app.js globals.
// DresscodeGift.tsx
function renderGifts() {
  const c = state.data.dataContent;
  const gifts = c.electronicGivings && c.electronicGivings.length > 0
    ? c.electronicGivings.map((item) => ({
      bankName: (item.bankName || "BCA").toUpperCase().replace("BANK ", ""),
      accountNumber: item.accountNumber || "",
      accountName: (item.accountName || "").toLowerCase(),
    }))
    : DEFAULT_GIFTS;
  const bankLogo = (name = "") => {
    const lower = name.toLowerCase();

    if (lower.includes("bca")) {
      return "assets/icons/ic_bca.webp";
    }

    if (lower.includes("mandiri")) {
      return "assets/icons/ic_mandiri.webp";
    }

    return "";
  };

  const list = $("#giftList");
  gifts.forEach((gift, index) => {
const card = el("div", `
  relative z-10 flex items-center bg-white
  shadow-[0px_4px_4px_rgba(0,0,0,0.25)]
  animate transition-transform hover:scale-[1.02]
  w-[284px] h-[66px]
  md:w-[350px] md:h-[70px]
  lg:w-[480px] lg:h-[120px]
  rounded-[10.9167px] border-[1px] border-white
  backdrop-blur-[1.09px]
`);

card.dataset.animate = "fade-up";

card.innerHTML = `
  <div class="
    w-[34px] h-[34px] ml-[18px]
    md:w-[40px] md:h-[40px] md:ml-[25px]
    lg:w-[45px] lg:h-[45px] lg:ml-[34px]
    flex-shrink-0 flex items-center justify-center
  ">
    <img
      width="45"
      height="45"
      class="
        w-[34px] h-[34px]
        md:w-[40px] md:h-[40px]
        lg:w-[45px] lg:h-[45px]
        object-contain
      "
      alt=""
    >
  </div>

  <div class="
    dg-account text-start flex flex-col
    pl-[18px] md:pl-[25px] lg:pl-[34px]
    flex-grow overflow-hidden
  ">
    <span class="truncate" data-f="number"></span>
    <span class="truncate" data-f="bank"></span>
    <span class="truncate" data-f="name"></span>
  </div>

  <button
    type="button"
    class="
      dg-copy-button mr-[18px]
      md:mr-[20px] lg:mr-[22px]
      flex-shrink-0 cursor-pointer
      hover:opacity-75 transition-opacity
    "
  >
    Copy
  </button>
`;
    const img = $("img", card);
    img.src = bankLogo(gift.bankName);
    img.alt = gift.bankName;
    $('[data-f="number"]', card).textContent = gift.accountNumber;
    $('[data-f="bank"]', card).textContent = gift.bankName;
    $('[data-f="name"]', card).textContent = gift.accountName.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    const btn = $("button", card);
    btn.addEventListener("click", () => {
      if (!gift.accountNumber) return;
      const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 2000); };
      (navigator.clipboard ? navigator.clipboard.writeText(gift.accountNumber) : Promise.reject()).then(done, done);
    });
    list.appendChild(card);
  });
}

function setupDresscodeGift() {
  const button = document.getElementById("copyGiftAccount");
  const account = document.getElementById("giftAccountNumber");
  const feedback = document.getElementById("copyGiftFeedback");

  if (!button || !account || !feedback) return;
  if (button.dataset.initialized === "true") return;

  button.dataset.initialized = "true";

  button.addEventListener("click", async () => {
    const accountNumber = account.textContent.trim();

    try {
      await navigator.clipboard.writeText(accountNumber);
      feedback.textContent = "Account number copied!";
    } catch {
      const input = document.createElement("textarea");
      input.value = accountNumber;
      input.style.position = "fixed";
      input.style.opacity = "0";

      document.body.appendChild(input);
      input.select();

      const copied = document.execCommand("copy");
      input.remove();

      feedback.textContent = copied
        ? "Account number copied!"
        : "Unable to copy. Please copy manually.";
    }
  });
}