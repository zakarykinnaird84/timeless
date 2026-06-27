(function () {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const type = params.get("type") === "creator" ? "creator" : "object";
    const root = document.getElementById("detail-root");

    if (!root || !slug) {
        if (root) {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Not found</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        }
        return;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function availabilityLabel(availability) {
        if (availability === "buyable") {
            return "Available to buy";
        }
        if (availability === "archival") {
            return "Out of production";
        }
        return "Reference";
    }

    Promise.all([
        fetch("data/objects.json").then((response) => response.json()),
        fetch("data/creators.json").then((response) => response.json()),
    ])
        .then(([objects, creators]) => {
            const collection = type === "creator" ? creators : objects;
            const item = collection.find((entry) => entry.slug === slug);

            if (!item) {
                root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Not found</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
                document.title = "Not found — Timeless Objects";
                return;
            }

            const brand = item.brand || item.discipline || "";
            const title = type === "creator" ? item.name : brand;
            const subtitle = type === "creator" ? item.discipline : item.name;
            document.title = `${item.name} — Timeless Objects`;

            const hero = item.image
                ? `<img class="hero-image detail-hero__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">`
                : `<div class="hero-placeholder detail-hero__placeholder" aria-hidden="true"></div>`;

            const externalLink = item.externalUrl
                ? `<a class="object-nav__external" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open link"><img src="assets/external-link.svg" alt="" width="8" height="8"></a>`
                : "";

            const description = item.description
                ? `<p class="detail-copy">${escapeHtml(item.description)}</p>`
                : "";

            const availability = item.availability
                ? `<p class="detail-meta">${availabilityLabel(item.availability)}</p>`
                : "";

            const externalCta = item.externalUrl
                ? `<p class="detail-copy"><a href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer">Where to find →</a></p>`
                : "";

            root.innerHTML = `
                <div class="detail-frame">
                    <header class="detail-header">
                        <h1 class="detail-title">${escapeHtml(title)}</h1>
                        <div class="detail-header__subtitle">
                            <p class="detail-subtitle">${escapeHtml(subtitle)}</p>
                            ${externalLink}
                        </div>
                    </header>
                    <div class="detail-hero hero-media">
                        ${hero}
                        <span class="hero-develop" aria-hidden="true"></span>
                    </div>
                    <div class="detail-body">
                        ${availability}
                        ${description}
                        ${externalCta}
                    </div>
                    <nav class="object-nav object-nav--detail" aria-label="Detail navigation">
                        <a class="object-nav__brand object-nav__brand--link" href="index.html">${escapeHtml(brand || "Timeless")}</a>
                        <div class="object-nav__end">
                            <span class="object-nav__link object-nav__link--current">${escapeHtml(item.name)}</span>
                            ${externalLink}
                        </div>
                    </nav>
                </div>
            `;

            document.dispatchEvent(new CustomEvent("detail:rendered"));
        })
        .catch(() => {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Error</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        });
})();
