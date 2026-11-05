// resize-images.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

sharp.cache(false);

// Folder gambar di project Vite
const DIR = path.join(
    process.cwd(),
    "assets"
);

// Pengaturan kualitas dan resolusi
const QUALITY = 80;
const EFFORT = 6;

const MOBILE_MAX = 2560;
const OTHER_MAX = 2560;
const MAX_HEIGHT = 3840;

// true  = hapus file asli setelah berhasil dikonversi
// false = simpan file asli
const DELETE_ORIGINALS = true;

// Format yang didukung
const CONVERT_EXT = /\.(png|jpe?g)$/i;
const WEBP_EXT = /\.webp$/i;

// Cari semua file dalam folder dan subfolder
function walk(dir) {
    if (!fs.existsSync(dir)) {
        throw new Error(`Folder tidak ditemukan: ${dir}`);
    }

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);

        return entry.isDirectory()
            ? walk(fullPath)
            : [fullPath];
    });
}

// Tentukan batas lebar berdasarkan nama file
function getMaxWidth(file) {
    const name = path.basename(file).toLowerCase();

    return name.startsWith("mobile_")
        ? MOBILE_MAX
        : OTHER_MAX;
}

async function processImage(file) {
    const isWebp = WEBP_EXT.test(file);
    const isConvertible = CONVERT_EXT.test(file);

    // Lewati GIF, SVG, dan format lainnya
    if (!isWebp && !isConvertible) {
        return { status: "skipped" };
    }

    const maxWidth = getMaxWidth(file);
    const relativePath = path.relative(DIR, file);

    try {
        // Baca ke buffer agar lebih aman di Windows
        const input = fs.readFileSync(file);

        const metadata = await sharp(input).metadata();
        const { width, height } = metadata;

        if (!width || !height) {
            console.log("SKIP (metadata tidak valid):", relativePath);
            return { status: "skipped" };
        }

        const tooBig =
            width > maxWidth ||
            height > MAX_HEIGHT;

        // WebP yang sudah sesuai resolusi tidak diproses ulang
        if (isWebp && !tooBig) {
            console.log(
                "SKIP (resolusi sudah sesuai):",
                relativePath,
                `${width}x${height}`
            );

            return { status: "skipped" };
        }

        // Tentukan lokasi output
        const target = isWebp
            ? file
            : file.replace(CONVERT_EXT, ".webp");

        // Jangan timpa WebP yang sudah ada dengan PNG/JPG
        if (isConvertible && fs.existsSync(target)) {
            if (DELETE_ORIGINALS) {
                fs.unlinkSync(file);

                console.log(
                    "REMOVED (WebP sudah ada):",
                    relativePath
                );

                return { status: "removed" };
            }

            console.log(
                "SKIP (WebP sudah ada):",
                relativePath
            );

            return { status: "skipped" };
        }

        // Resize dan konversi ke WebP
        const output = await sharp(input)
            .resize({
                width: maxWidth,
                height: MAX_HEIGHT,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({
                quality: QUALITY,
                effort: EFFORT,
            })
            .toBuffer();

        // Tulis hasil ke file
        fs.writeFileSync(target, output);

        const outputMetadata = await sharp(output).metadata();

        if (isConvertible) {
            console.log(
                "CONVERTED:",
                relativePath,
                "->",
                path.relative(DIR, target),
                `(${width}x${height} -> ${outputMetadata.width}x${outputMetadata.height})`
            );

            if (DELETE_ORIGINALS) {
                fs.unlinkSync(file);
            }

            return { status: "converted" };
        }

        console.log(
            "RESIZED:",
            relativePath,
            `(${width}x${height} -> ${outputMetadata.width}x${outputMetadata.height})`
        );

        return { status: "resized" };
    } catch (error) {
        console.error(
            "ERROR:",
            relativePath,
            "-",
            error.message
        );

        return { status: "error" };
    }
}

(async () => {
    console.log("==================================");
    console.log(" VITE IMAGE OPTIMIZER");
    console.log("==================================");
    console.log("Folder :", DIR);
    console.log("Quality:", QUALITY);
    console.log("Effort :", EFFORT);
    console.log("Max width :", OTHER_MAX);
    console.log("Max height:", MAX_HEIGHT);
    console.log("Delete originals:", DELETE_ORIGINALS);
    console.log("==================================\n");

    try {
        const files = walk(DIR);

        let converted = 0;
        let resized = 0;
        let removed = 0;
        let skipped = 0;
        let errors = 0;

        for (const file of files) {
            const result = await processImage(file);

            switch (result.status) {
                case "converted":
                    converted++;
                    break;
                case "resized":
                    resized++;
                    break;
                case "removed":
                    removed++;
                    break;
                case "error":
                    errors++;
                    break;
                default:
                    skipped++;
                    break;
            }
        }

        console.log("\n==================================");
        console.log(" SUMMARY");
        console.log("==================================");
        console.log("Converted PNG/JPG :", converted);
        console.log("Resized WebP      :", resized);
        console.log("Removed originals :", removed);
        console.log("Skipped           :", skipped);
        console.log("Errors            :", errors);
        console.log("==================================");

        if (converted > 0) {
            console.log(
                "\nPENTING: Ganti referensi .png/.jpg di kode menjadi .webp."
            );
        }

        console.log("\nSelesai!");
    } catch (error) {
        console.error("\nGagal:", error.message);
        process.exitCode = 1;
    }
})();