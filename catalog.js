(function () {
    const catalogEl = document.getElementById("catalog");
    const CATALOG_EXTERNAL_LINK_ICON = `<svg class="object-nav__external-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true"><path d="M5 5h8v8M5 13l8-8" stroke="currentColor"/></svg>`;

    if (!catalogEl) {
        return;
    }

    let objects = [];
    let creators = [];
    let currentView = "objects";
    let activeCategory = "all";
    let activeCollection = "featured";
    let isInitialCatalogRender = true;
    let heroIndex = 0;
    let keyboardNavBound = false;

    const NEW_COLLECTION_ORDER = [
        "de-la-warr-pavilion-chair",
        "up-5",
        "panton-chair",
        "chair-one-magis",
        "blockitecture-frank-lloyd-wright",
        "airpods",
        "dyson-ontrac",
        "nothing-headphones",
        "cp2-instant-disk-audio",
    ];

    const CURATED_COLLECTION_ORDER = [
        "chair-one-magis",
        "de-la-warr-pavilion-chair",
        "blockitecture-frank-lloyd-wright",
    ];

    function sortBySlugOrder(items, order) {
        const rank = new Map(order.map((slug, index) => [slug, index]));

        return [...items].sort((a, b) => {
            const aRank = rank.has(a.slug) ? rank.get(a.slug) : Number.MAX_SAFE_INTEGER;
            const bRank = rank.has(b.slug) ? rank.get(b.slug) : Number.MAX_SAFE_INTEGER;
            return aRank - bRank;
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function sortFeaturedFirst(items) {
        return [...items].sort((a, b) => {
            if (a.featured && !b.featured) {
                return -1;
            }
            if (!a.featured && b.featured) {
                return 1;
            }
            return 0;
        });
    }

    function getActiveItems() {
        const source = currentView === "creators" ? creators : objects;
        let items = source.filter((item) => item.published !== false && getListingImage(item));

        if (currentView === "objects") {
            if (activeCollection === "curated") {
                items = items.filter((item) => item.curated);
                items = sortBySlugOrder(items, CURATED_COLLECTION_ORDER);
            } else if (activeCollection === "new") {
                items = sortBySlugOrder(items, NEW_COLLECTION_ORDER);
            }

            if (activeCategory !== "all") {
                items = items.filter((item) => item.category === activeCategory);
            }

            if (activeCollection === "featured") {
                return sortFeaturedFirst(items);
            }

            if (activeCollection === "curated" || activeCollection === "new") {
                return items;
            }
        }

        return items;
    }

    function rotateItems(items, startIndex) {
        if (items.length <= 1 || startIndex === 0) {
            return items;
        }

        const normalized = ((startIndex % items.length) + items.length) % items.length;
        return [...items.slice(normalized), ...items.slice(0, normalized)];
    }

    function shouldIgnoreCatalogKeydown(event) {
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

    function bindCatalogKeyboardNav() {
        if (keyboardNavBound) {
            return;
        }

        keyboardNavBound = true;

        document.addEventListener("keydown", (event) => {
            if (!dataLoaded || shouldIgnoreCatalogKeydown(event)) {
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

            const items = getActiveItems();
            if (items.length <= 1) {
                return;
            }

            event.preventDefault();
            const offset = direction === "next" ? 1 : -1;
            heroIndex = (heroIndex + offset + items.length) % items.length;
            renderCatalog();
        });
    }

    function getListingImage(item) {
        return item.listingImage || item.image || null;
    }

    function renderHeroImage(item, alt, isFirst) {
        const src = getListingImage(item);
        if (src) {
            const loading = isFirst ? "eager" : "lazy";
            return `<img class="hero-image" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="${loading}">`;
        }
        return `<div class="hero-placeholder" aria-hidden="true"></div>`;
    }

    function renderBrandEnd(item) {
        const brand = escapeHtml(item.brand || item.discipline || "");
        if (!brand) {
            return "";
        }

        if (!item.externalUrl) {
            return `<span class="object-nav__brand">${brand}</span>`;
        }

        return `<a class="object-nav__brand--link" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${brand} link"><span class="object-nav__brand-name">${brand}</span><span class="object-nav__external" aria-hidden="true">${CATALOG_EXTERNAL_LINK_ICON}</span></a>`;
    }

    function renderObjectSection(item, index) {
        const isFirst = index === 0;
        const introAttr = isFirst && isInitialCatalogRender ? ' data-intro="true"' : "";
        const brand = escapeHtml(item.brand || item.discipline || "");
        const name = escapeHtml(item.name);
        const slug = escapeHtml(item.slug);
        const category = escapeHtml(item.category);
        const itemType = currentView === "creators" ? "creator" : "object";
        const alt = `${item.name}${item.brand ? ` by ${item.brand}` : item.discipline ? ` — ${item.discipline}` : ""}`;
        const detailHref = `detail.html?slug=${slug}&type=${itemType}`;

        if (isFirst) {
            return `
            <section class="object-screen object-screen--featured" id="${category}-${slug}" data-category="${category}" data-slug="${slug}">
                <div class="object-screen__inner">
                    <a class="object-hero hero-media object-hero__link" href="${detailHref}" aria-label="View ${name}"${introAttr}>
                        ${renderHeroImage(item, alt, true)}
                        <span class="hero-develop" aria-hidden="true"></span>
                    </a>
                    <nav class="object-nav" aria-label="${name}">
                        <a class="object-nav__link" href="${detailHref}">${name}</a>
                        <div class="object-nav__end">
                            ${renderBrandEnd(item)}
                        </div>
                    </nav>
                </div>
            </section>
        `;
        }

        const listingImage = getListingImage(item);
        const media = listingImage
            ? `<img class="object-card__image" src="${escapeHtml(listingImage)}" alt="${escapeHtml(alt)}" loading="lazy">`
            : `<div class="object-card__placeholder" aria-hidden="true"></div>`;

        return `
            <article class="object-card" id="${category}-${slug}" data-category="${category}" data-slug="${slug}">
                <a class="object-card__media" href="${detailHref}">
                    ${media}
                </a>
                <nav class="object-nav object-nav--card" aria-label="${name}">
                    <a class="object-nav__link" href="${detailHref}">${name}</a>
                    <div class="object-nav__end">
                        ${renderBrandEnd(item)}
                    </div>
                </nav>
            </article>
        `;
    }

    function renderCatalogSections(items) {
        if (items.length === 0) {
            return "";
        }

        const featured = renderObjectSection(items[0], 0);
        const rest = items.slice(1);

        if (rest.length === 0) {
            return featured;
        }

        const grid = rest.map((item, index) => renderObjectSection(item, index + 1)).join("");
        return `${featured}<div class="catalog-grid">${grid}</div>`;
    }

    function renderEmptyState() {
        return `<p class="catalog-empty">Nothing here yet. Try another filter.</p>`;
    }

    function renderCatalog() {
        const items = rotateItems(getActiveItems(), heroIndex);

        if (items.length === 0) {
            catalogEl.innerHTML = renderEmptyState();
        } else {
            catalogEl.innerHTML = renderCatalogSections(items);
        }

        window.scrollTo({ top: 0, behavior: "auto" });
        isInitialCatalogRender = false;
        document.dispatchEvent(new CustomEvent("catalog:rendered", { detail: { count: items.length } }));
    }

    let dataLoaded = false;

    function applyFilterState(view, category, collection) {
        currentView = view;
        activeCategory = category;
        activeCollection = collection || "featured";
        heroIndex = 0;
        if (dataLoaded) {
            renderCatalog();
        }
    }

    document.addEventListener("filter:ready", (event) => {
        applyFilterState(event.detail.view, event.detail.category, event.detail.collection);
    });

    document.addEventListener("filter:change", (event) => {
        applyFilterState(event.detail.view, event.detail.category, event.detail.collection);
    });

    Promise.all([
        fetch("data/objects.json").then((response) => response.json()),
        fetch("data/creators.json").then((response) => response.json()),
    ])
        .then(([objectsData, creatorsData]) => {
            objects = objectsData;
            creators = creatorsData;
            dataLoaded = true;
            bindCatalogKeyboardNav();
            renderCatalog();
        })
        .catch(() => {
            catalogEl.innerHTML = `<p class="catalog-error">Could not load catalog.</p>`;
            document.documentElement.classList.remove("catalog-boot");
        });
})();
