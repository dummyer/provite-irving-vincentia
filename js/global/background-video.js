
/**
 * Global Background Video
 * Fixed di viewport, berada di belakang semua komponen.
 */
function setupBackgroundVideo() {
  const v = $("#backgroundVideo");
  if (!v) return;
  v.muted = true;

  const freeze = () => {
    v.pause();
    v.currentTime = 0;
  };

  if (!v.paused && v.readyState >= 3) {
    freeze();
  } else {
    v.addEventListener("playing", freeze, { once: true });
  }
}

function playBackgroundVideo(retry = 3) {
  const v = $("#backgroundVideo");
  if (!v) return;
  v.muted = true;

  v.play().catch((e) => {
    if (e.name === "AbortError" && retry > 0) {
      setTimeout(() => playBackgroundVideo(retry - 1), 300);
    } else {
      console.warn("Video gagal play:", e);
    }
  });
}