(function () {
    const catalogEl = document.getElementById("catalog");

    if (!catalogEl) {
        return;
    }

    let objects = [];
    let creators = [];
    let currentView = "objects";
    let activeCategory = "all";
    let activeCollection = "new";

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
        }

        return sortFeaturedFirst(items);
    }

    function renderHeroImage(item, alt, isFirst) {
        if (item.image) {
            const loading = isFirst ? "eager" : "lazy";
            return `<img class="hero-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(alt)}" loading="${loading}">`;
        }
        return `<div class="hero-placeholder" aria-hidden="true"></div>`;
    }

    function renderExternalLink(item) {
        if (!item.externalUrl) {
            return "";
        }
        return `<a class="object-nav__external" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(item.name)} link"><img src="assets/external-link.svg" alt="" width="8" height="8"></a>`;
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

        return `
            <section class="object-screen" id="${category}-${slug}" data-category="${category}" data-slug="${slug}">
                <div class="object-screen__inner">
                    <div class="object-hero hero-media"${introAttr}>
                        ${renderHeroImage(item, alt, isFirst)}
                        <span class="hero-develop" aria-hidden="true"></span>
                    </div>
                    <nav class="object-nav" aria-label="${name}">
                        <span class="object-nav__brand">${brand}</span>
                        <div class="object-nav__end">
                            <a class="object-nav__link" href="detail.html?slug=${slug}&type=${itemType}">${name}</a>
                            ${renderExternalLink(item)}
                        </div>
                    </nav>
                </div>
            </section>
        `;
    }

    function renderEmptyState() {
        return `<p class="catalog-empty">Nothing here yet. Try another filter.</p>`;
    }

    function renderCatalog() {
        const items = getActiveItems();

        if (items.length === 0) {
            catalogEl.innerHTML = renderEmptyState();
        } else {
            catalogEl.innerHTML = items.map(renderObjectSection).join("");
        }

        catalogEl.scrollTo({ top: 0, behavior: "auto" });
        document.dispatchEvent(new CustomEvent("catalog:rendered", { detail: { count: items.length } }));
    }

    let dataLoaded = false;

    function applyFilterState(view, category, collection) {
        currentView = view;
        activeCategory = category;
        activeCollection = collection || "new";
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
