
 // Component module: classic script, shares app.js globals.
 // ---------- tombol RSVP melayang (RSVPButton.tsx) ----------

function setupRsvpButton(visible) {
    if (!visible) return;

    $("#rsvpFloat").classList.remove("hidden");

    const tip = $("#rsvpTooltip");
    const btnRsvpFloat = $("#btnRsvpFloat");

    if (!tip || !btnRsvpFloat) return;

    let tooltipTriggered = false;
    let tooltipTimer = null;

    const showTip = (show) => {
        tip.classList.toggle("opacity-0", !show);
        tip.classList.toggle("translate-x-4", !show);
        tip.classList.toggle("pointer-events-none", !show);
        tip.classList.toggle("opacity-100", show);
        tip.classList.toggle("translate-x-0", show);
        tip.classList.toggle("pointer-events-auto", show);
    };

    const hideTip = () => {
        showTip(false);

        setTimeout(() => {
            tip.classList.add("hidden");
        }, 300);
    };

    const handleScroll = () => {
        // Tunggu sampai user scroll ke bawah pertama kali.
        if (window.scrollY <= 0 || tooltipTriggered) return;

        tooltipTriggered = true;
        window.removeEventListener("scroll", handleScroll);

        // Mulai timer 1,5 detik setelah scroll pertama.
        tooltipTimer = setTimeout(() => {
            tip.classList.remove("hidden");

            requestAnimationFrame(() => {
                showTip(true);
            });

            // Hilang otomatis 3,5 detik setelah muncul.
            tooltipTimer = setTimeout(hideTip, 3500);
        }, 1500);
    };

    window.addEventListener("scroll", handleScroll, {
        passive: true,
    });

    const scrollToRSVP = () => {
        const target = document.getElementById("reservation");

        if (target) {
            window.scrollTo({
                top:
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    0,
                behavior: "smooth",
            });
        }

        hideTip();
    };

    tip.addEventListener("click", scrollToRSVP);
    btnRsvpFloat.addEventListener("click", scrollToRSVP);
}
