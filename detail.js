(function () {
    const DETAIL_EXTERNAL_LINK_ICON = `<svg class="detail-brand__external-icon" width="0.7em" height="0.7em" viewBox="46.828 46.823 82.118 82.118" fill="none" aria-hidden="true"><path d="M48.828 48.823h78.118v78.118M48.828 126.941l78.118-78.118" stroke="currentColor" stroke-width="4"/></svg>`;
    const CATALOG_EXTERNAL_LINK_ICON = `<svg class="object-nav__external-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true"><path d="M5 5h8v8M5 13l8-8" stroke="currentColor"/></svg>`;

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

    function getListingImage(item) {
        return item.listingImage || item.image || null;
    }

    function renderBrandEnd(relatedItem) {
        const brand = escapeHtml(relatedItem.brand || relatedItem.discipline || "");
        if (!brand) {
            return "";
        }

        if (!relatedItem.externalUrl) {
            return `<span class="object-nav__brand">${brand}</span>`;
        }

        return `<a class="object-nav__brand--link" href="${escapeHtml(relatedItem.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${brand} link"><span class="object-nav__brand-name">${brand}</span><span class="object-nav__external" aria-hidden="true">${CATALOG_EXTERNAL_LINK_ICON}</span></a>`;
    }

    function renderRelatedCard(relatedItem, itemType) {
        const name = escapeHtml(relatedItem.name);
        const relatedSlug = escapeHtml(relatedItem.slug);
        const category = escapeHtml(relatedItem.category || "");
        const detailHref = `detail.html?slug=${relatedSlug}&type=${itemType}`;
        const alt = `${relatedItem.name}${relatedItem.brand ? ` by ${relatedItem.brand}` : relatedItem.discipline ? ` — ${relatedItem.discipline}` : ""}`;
        const listingImage = getListingImage(relatedItem);
        const media = listingImage
            ? `<img class="object-card__image" src="${escapeHtml(listingImage)}" alt="${escapeHtml(alt)}" loading="lazy">`
            : `<div class="object-card__placeholder" aria-hidden="true"></div>`;

        return `
            <article class="object-card" id="${category}-${relatedSlug}" data-category="${category}" data-slug="${relatedSlug}">
                <a class="object-card__media" href="${detailHref}">
                    ${media}
                </a>
                <nav class="object-nav object-nav--card" aria-label="${name}">
                    <a class="object-nav__link" href="${detailHref}">${name}</a>
                    <div class="object-nav__end">
                        ${renderBrandEnd(relatedItem)}
                    </div>
                </nav>
            </article>
        `;
    }

    function renderRelatedGrid(currentItem, collection, itemType) {
        const relatedItems = collection.filter((entry) => {
            if (entry.slug === currentItem.slug) {
                return false;
            }

            if (itemType === "creator") {
                return true;
            }

            return entry.category === currentItem.category;
        });

        if (relatedItems.length === 0) {
            return "";
        }

        const cards = relatedItems.map((relatedItem) => renderRelatedCard(relatedItem, itemType)).join("");

        return `
            <section class="detail-related" aria-label="More in this category">
                <div class="catalog-grid catalog-grid--detail">${cards}</div>
            </section>
        `;
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
                ? item.description
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((paragraph) => `<p class="detail-copy">${escapeHtml(paragraph.trim())}</p>`)
                      .join("")
                : `<p class="detail-copy detail-copy--empty">No description yet.</p>`;

            const relatedGrid = renderRelatedGrid(item, collection, type);

            const brandAside = brandMarkup
                ? `<div class="detail-brand detail-brand--aside">${brandMarkup}</div>`
                : "";
            const brandMobileFooter = brandMarkup
                ? `<div class="detail-brand detail-brand--mobile-footer">${brandMarkup}</div>`
                : "";

            const heroMediaInner = `
                        <div class="detail-hero__media hero-media">
                            ${hero}
                            <span class="hero-develop" aria-hidden="true"></span>
                        </div>`;

            const heroMarkup = item.externalUrl
                ? `<a class="detail-hero__link" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(name)} link">${heroMediaInner}</a>`
                : heroMediaInner;

            root.innerHTML = `
                <div class="detail-frame">
                    <header class="detail-header">
                        <h1 class="detail-title">${escapeHtml(name)}</h1>
                    </header>
                    <div class="detail-hero">
                        ${heroMarkup}
                    </div>
                    <div class="detail-content">
                        <h2 class="detail-about__heading">About</h2>
                        ${brandAside}
                        <div class="detail-about__body">
                            ${description}
                        </div>
                        ${brandMobileFooter}
                    </div>
                    ${relatedGrid}
                </div>
            `;

            document.dispatchEvent(new CustomEvent("detail:rendered"));
        })
        .catch(() => {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Error</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        });
})();
