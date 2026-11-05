function setupDresscode(data) {
    const isDcFamily = data?.groups?.some(
        (g) => g?.name?.trim().toLowerCase() === "dc family"
    ) ?? false;
    if (isDcFamily) return; // default (kiri)

    const img = $("#dresscodeImg");
    if (img) {
        img.src = "assets/images/dresscode_2.webp";
        img.classList.remove("w-[143px]");
        img.classList.add("w-[160px]");
    }
    const men = $("#dcMen");
    if (men) men.textContent = "Black Suit No tie";

    const women = $("#dcWomen");
    if (women) women.innerHTML = "Pastel Evening Gown<br />Soft Blue, Soft Pink, Cream, Sage Green";

    const avoid = $("#dcAvoid");
    if (avoid) avoid.innerHTML = "PLEASE AVOID WEARING<br />WHITE GOWN &amp; BATIK";
}