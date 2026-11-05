// Component module: classic script, shares app.js globals.

/**
 * Hero component
 * Hanya menangani interaksi Hero.
 */

function setupHero() {
    const arrow = $("#heroArrow");

    if (arrow) {
        arrow.addEventListener("click", () => {
            openInvitation();

            const next =
                document.getElementById("profile") ||
                document.getElementById("counting-down") ||
                document.getElementById("location");

            if (next) {
                next.scrollIntoView({
                    behavior: "smooth",
                });
            }
        });
    }
}


function playHeroVideo() {
  const video = $("#heroVideo");
  if (!video || !video.getAttribute("src")) return; // tidak ada video: lewati

  const attempt = () => video.play().catch(() => {});
  attempt();
  video.addEventListener("canplay", attempt, { once: true });
}