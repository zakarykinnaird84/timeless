(function () {
    const DETAIL_EXTERNAL_LINK_ICON = `<svg class="detail-brand__external-icon" width="0.7em" height="0.7em" viewBox="46.828 46.823 82.118 82.118" fill="none" aria-hidden="true"><path d="M48.828 48.823h78.118v78.118M48.828 126.941l78.118-78.118" stroke="currentColor" stroke-width="4"/></svg>`;
    const CATALOG_EXTERNAL_LINK_ICON = `<svg class="object-nav__external-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true"><path d="M5 5h8v8M5 13l8-8" stroke="currentColor"/></svg>`;

    const DETAIL_KEYBOARD_NAV_KEY = "timeless-detail-keyboard-nav";

    function markKeyboardDetailNav() {
        try {
            sessionStorage.setItem(DETAIL_KEYBOARD_NAV_KEY, "1");
        } catch (error) {}
    }

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

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const DETAIL_IMAGE_DIMENSIONS = {
        "images/objects/cp2_detail.webp": [1500, 1500],
        "images/objects/nothing-headphones-detail.webp": [4096, 2305],
        "images/objects/ontac-detail.webp": [2321, 2364],
        "images/objects/airpods-detail.webp": [4096, 2730],
        "images/objects/blockitecture_frank_lloyd_wright_detail.webp": [1512, 1512],
        "images/objects/chair_one-magis-detail.webp": [1728, 939],
        "images/objects/panton-chair-vitra-detail.webp": [1600, 1083],
        "images/objects/up-5-detail.webp": [1600, 1600],
        "images/objects/de-la-warr-pavilion-chair-detail.webp": [1600, 1781],
    };

    function getDetailImage(item) {
        return item.detailImage || item.listingImage || item.image || null;
    }

    function getDetailImageDimensions(src) {
        if (!src) {
            return [1, 1];
        }

        return DETAIL_IMAGE_DIMENSIONS[src] || [1, 1];
    }

    function renderDetailHeroImage(src, name) {
        const [width, height] = getDetailImageDimensions(src);
        return `<img class="hero-image detail-hero__image" src="${escapeHtml(src)}" alt="${escapeHtml(name)}" width="${width}" height="${height}">`;
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

    function getCategoryItems(collection, currentItem, itemType) {
        if (itemType === "creator") {
            return collection;
        }

        return collection.filter((entry) => entry.category === currentItem.category);
    }

    function getAdjacentItem(collection, currentItem, itemType, direction) {
        const items = getCategoryItems(collection, currentItem, itemType);
        if (items.length <= 1) {
            return null;
        }

        const currentIndex = items.findIndex((entry) => entry.slug === currentItem.slug);
        if (currentIndex === -1) {
            return null;
        }

        const offset = direction === "next" ? 1 : -1;
        const nextIndex = (currentIndex + offset + items.length) % items.length;
        return items[nextIndex];
    }

    function bindDetailKeyboardNav(collection, currentItem, itemType) {
        if (getCategoryItems(collection, currentItem, itemType).length <= 1) {
            return;
        }

        function shouldIgnoreKeydown(event) {
            if (event.metaKey || event.ctrlKey || event.altKey) {
                return true;
            }

            const target = event.target;
            if (!(target instanceof Element)) {
                return false;
            }

            if (target.closest("input, textarea, select, [contenteditable='true']")) {
                return true;
            }

            return Boolean(target.closest(".collection-dropdown.is-open"));
        }

        document.addEventListener("keydown", (event) => {
            if (shouldIgnoreKeydown(event)) {
                return;
            }

            let direction = null;
            if (event.key === "ArrowLeft") {
                direction = "prev";
            } else if (event.key === "ArrowRight") {
                direction = "next";
            }

            if (!direction) {
                return;
            }

            const adjacentItem = getAdjacentItem(collection, currentItem, itemType, direction);
            if (!adjacentItem) {
                return;
            }

            event.preventDefault();
            markKeyboardDetailNav();
            window.location.href = `detail.html?slug=${encodeURIComponent(adjacentItem.slug)}&type=${itemType}`;
        });
    }

    function renderRelatedGrid(currentItem, collection, itemType) {
        const relatedItems = getCategoryItems(collection, currentItem, itemType).filter(
            (entry) => entry.slug !== currentItem.slug && entry.published !== false && getListingImage(entry)
        );

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
            const item = collection.find((entry) => entry.slug === slug && entry.published !== false);

            if (!item) {
                root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Not found</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
                document.title = "Not found — Timeless Objects";
                return;
            }

            const brand = item.brand || item.discipline || "";
            const name = item.name;
            document.title = `${name} — Timeless Objects`;

            const detailImageSrc = getDetailImage(item);
            const hero = detailImageSrc
                ? renderDetailHeroImage(detailImageSrc, name)
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
                        <h1 class="detail-title"><a class="detail-title__link" href="index.html">${escapeHtml(name)}</a></h1>
                        <button
                            type="button"
                            class="detail-header__dot"
                            aria-label="Open browse menu"
                            aria-expanded="false"
                            aria-controls="detail-site-header"
                        >
                            <span class="detail-header__dot-mark" aria-hidden="true"></span>
                        </button>
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

            document.dispatchEvent(
                new CustomEvent("detail:context", {
                    detail: {
                        category: item.category || "all",
                        type,
                    },
                })
            );

            if (window.TimelessSiteMeta) {
                window.TimelessSiteMeta.getSiteConfig().then((site) => {
                    const pageUrl = `${site.origin.replace(/\/$/, "")}/detail.html?slug=${encodeURIComponent(item.slug)}&type=${type}`;
                    const shareImage = detailImageSrc || site.ogImage;
                    const shareDescription =
                        window.TimelessSiteMeta.summarizeDescription(item.description) ||
                        `${name}${brand ? ` by ${brand}` : ""}. ${site.tagline || site.description}`;

                    window.TimelessSiteMeta.setPageMeta({
                        title: `${name} — ${site.name}`,
                        description: shareDescription,
                        url: pageUrl,
                        image: window.TimelessSiteMeta.absoluteUrl(site.origin, shareImage),
                        imageWidth: site.ogImageWidth,
                        imageHeight: site.ogImageHeight,
                        imageAlt: `${name}${brand ? ` by ${brand}` : ""}`,
                        type: "article",
                        siteName: site.name,
                        twitterCard: site.twitterCard,
                    });
                });
            }

            document.dispatchEvent(new CustomEvent("detail:rendered"));
            bindDetailKeyboardNav(collection, item, type);
            window.scrollTo(0, 0);
        })
        .catch(() => {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Error</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        });
})();
