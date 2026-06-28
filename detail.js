(function () {
    const DETAIL_EXTERNAL_LINK_ICON = `<svg class="detail-brand__external-icon" width="0.7em" height="0.7em" viewBox="46.828 46.823 82.118 82.118" fill="none" aria-hidden="true"><path d="M48.828 48.823h78.118v78.118M48.828 126.941l78.118-78.118" stroke="currentColor" stroke-width="4"/></svg>`;

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

    function getDetailImage(item) {
        return item.detailImage || item.listingImage || item.image || null;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
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
            const name = item.name;
            document.title = `${name} — Timeless Objects`;

            const hero = getDetailImage(item)
                ? `<img class="hero-image detail-hero__image" src="${escapeHtml(getDetailImage(item))}" alt="${escapeHtml(name)}">`
                : `<div class="hero-placeholder detail-hero__placeholder" aria-hidden="true"></div>`;

            const brandExternalLink = item.externalUrl
                ? `<span class="detail-brand__external" aria-hidden="true">${DETAIL_EXTERNAL_LINK_ICON}</span>`
                : "";

            const brandMarkup = brand
                ? item.externalUrl
                    ? `<a class="detail-brand__link" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(brand)} link"><span class="detail-brand__name">${escapeHtml(brand)}</span>${brandExternalLink}</a>`
                    : `<div class="detail-brand__link"><span class="detail-brand__name">${escapeHtml(brand)}</span></div>`
                : "";

            const description = item.description
                ? `<p class="detail-copy">${escapeHtml(item.description)}</p>`
                : `<p class="detail-copy detail-copy--empty">No description yet.</p>`;

            root.innerHTML = `
                <div class="detail-frame">
                    <header class="detail-header">
                        <h1 class="detail-title">${escapeHtml(name)}</h1>
                    </header>
                    <div class="detail-hero">
                        <div class="detail-hero__media hero-media">
                            ${hero}
                            <span class="hero-develop" aria-hidden="true"></span>
                        </div>
                    </div>
                    <div class="detail-content">
                        <div class="detail-about">
                            <h2 class="detail-about__heading">About</h2>
                            ${description}
                        </div>
                        ${brandMarkup ? `<div class="detail-brand">${brandMarkup}</div>` : ""}
                    </div>
                </div>
            `;

            document.dispatchEvent(new CustomEvent("detail:rendered"));
        })
        .catch(() => {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Error</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        });
})();
