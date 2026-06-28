(function () {
    const catalogEl = document.getElementById("catalog");

    if (!catalogEl) {
        return;
    }

    let objects = [];
    let creators = [];
    let currentView = "objects";
    let activeCategory = "all";
    let activeCollection = "featured";

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
        let items = [...source];

        if (currentView === "objects") {
            if (activeCollection === "editor-picks") {
                items = items.filter((item) => item.featured);
            }

            if (activeCategory !== "all") {
                items = items.filter((item) => item.category === activeCategory);
            }

            if (activeCollection === "featured" || activeCollection === "editor-picks") {
                return sortFeaturedFirst(items);
            }
        }

        return items;
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

    function renderExternalLink(item) {
        if (!item.externalUrl) {
            return "";
        }
        return `<a class="object-nav__external" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(item.name)} link"><img src="assets/external-link.svg" alt="" width="16" height="16"></a>`;
    }

    function renderObjectSection(item, index) {
        const isFirst = index === 0;
        const introAttr = isFirst ? ' data-intro="true"' : "";
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
                            <span class="object-nav__brand">${brand}</span>
                            ${renderExternalLink(item)}
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
                        <span class="object-nav__brand">${brand}</span>
                        ${renderExternalLink(item)}
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
        const items = getActiveItems();

        if (items.length === 0) {
            catalogEl.innerHTML = renderEmptyState();
        } else {
            catalogEl.innerHTML = renderCatalogSections(items);
        }

        window.scrollTo({ top: 0, behavior: "auto" });
        document.dispatchEvent(new CustomEvent("catalog:rendered", { detail: { count: items.length } }));
    }

    let dataLoaded = false;

    function applyFilterState(view, category, collection) {
        currentView = view;
        activeCategory = category;
        activeCollection = collection || "featured";
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
            renderCatalog();
        })
        .catch(() => {
            catalogEl.innerHTML = `<p class="catalog-error">Could not load catalog.</p>`;
        });
})();
