(function () {
    const LEFT_FILTERS = [
        { type: "all", value: "all", label: "Home" },
        { type: "category", value: "furniture", label: "Furniture" },
        { type: "category", value: "audio", label: "Audio" },
        { type: "category", value: "studio", label: "Workspace" },
        { type: "category", value: "gaming", label: "Gaming" },
        { type: "category", value: "collectable", label: "Collectable" },
        { type: "category", value: "fashion", label: "Fashion" },
    ];

    const COLLECTION_OPTIONS = [
        { value: "featured", label: "Featured" },
        { value: "new", label: "New" },
        { value: "curated", label: "Curated" },
    ];

    const MOBILE_MAX_WIDTH = 768;

    const headerFilterBarEl = document.querySelector(".site-header .filter-bar");
    const footerFilterBarEl = document.querySelector(".site-footer__nav .filter-bar");
    const filterStartEl = headerFilterBarEl?.querySelector(".filter-bar__group--start") || null;
    const filterEndEl = headerFilterBarEl?.querySelector(".filter-bar__group--end") || null;
    const footerFilterStartEl = footerFilterBarEl?.querySelector(".filter-bar__group--start") || null;
    const catalogEl = document.getElementById("catalog");
    const isCatalogPage = Boolean(catalogEl);

    if (!headerFilterBarEl && !footerFilterBarEl) {
        return;
    }

    if (headerFilterBarEl && (!filterStartEl || !filterEndEl)) {
        return;
    }

    const filterBarEls = [headerFilterBarEl, footerFilterBarEl].filter(Boolean);
    const filterStartEls = [filterStartEl, footerFilterStartEl].filter(Boolean);

    const COLLECTIONS = new Set(COLLECTION_OPTIONS.map((option) => option.value));
    const DEFAULT_COLLECTION = "featured";
    const params = new URLSearchParams(window.location.search);
    let currentView = params.get("view") === "creators" ? "creators" : "objects";
    let activeCategory = params.get("category") || "all";
    const collectionParam = params.get("collection");
    let activeCollection = COLLECTIONS.has(collectionParam) ? collectionParam : DEFAULT_COLLECTION;
    let collectionDropdownOpen = false;

    function getCollectionLabel(value) {
        return COLLECTION_OPTIONS.find((option) => option.value === value)?.label || "Featured";
    }

    function renderCategoryButtons() {
        return LEFT_FILTERS.map((item) => {
            const isActive =
                item.type === "all"
                    ? currentView === "objects" && activeCategory === "all"
                    : currentView === "objects" && activeCategory === item.value;

            if (item.type === "all") {
                return `<button type="button" class="filter-bar__link${isActive ? " filter-bar__link--active" : ""}" data-category="all">${item.label}</button>`;
            }

            return `<button type="button" class="filter-bar__link${isActive ? " filter-bar__link--active" : ""}" data-category="${item.value}">${item.label}</button>`;
        }).join("");
    }

    function renderLeftFilters() {
        if (!filterStartEl) {
            return;
        }

        filterStartEl.innerHTML = renderCategoryButtons();
    }

    function renderFooterFilters() {
        if (!footerFilterStartEl) {
            return;
        }

        const creatorsActive = currentView === "creators";
        const creatorsButton = `<button type="button" class="filter-bar__link${creatorsActive ? " filter-bar__link--active" : ""}" data-view="creators">Creators</button>`;
        footerFilterStartEl.innerHTML = `${renderCategoryButtons()}${creatorsButton}`;
    }

    function renderCollectionControls() {
        if (!filterEndEl) {
            return;
        }

        const desktopButtons = COLLECTION_OPTIONS.map((option) => {
            const isActive = option.value === activeCollection;
            return `<button type="button" class="filter-bar__link${isActive ? " filter-bar__link--active" : ""}" data-collection="${option.value}">${option.label}</button>`;
        }).join("");

        const mobileOptions = COLLECTION_OPTIONS.filter((option) => option.value !== activeCollection)
            .map((option) => {
                return `<button type="button" class="collection-dropdown__option filter-bar__link" data-collection="${option.value}" role="option" aria-selected="false">${option.label}</button>`;
            })
            .join("");

        filterEndEl.innerHTML = `
            <div class="collection-tabs collection-tabs--desktop">
                ${desktopButtons}
            </div>
            <div class="collection-dropdown collection-dropdown--mobile${collectionDropdownOpen ? " is-open" : ""}" data-collection-dropdown>
                <button
                    type="button"
                    class="collection-dropdown__trigger filter-bar__link filter-bar__link--active"
                    aria-haspopup="listbox"
                    aria-expanded="${collectionDropdownOpen}"
                    aria-controls="collection-menu-mobile"
                    id="collection-trigger-mobile"
                >
                    <span class="collection-dropdown__label">${getCollectionLabel(activeCollection)}</span>
                </button>
                <div class="collection-dropdown__menu" id="collection-menu-mobile" role="listbox" aria-labelledby="collection-trigger-mobile">
                    ${mobileOptions}
                </div>
            </div>
        `;
    }

    function closeCollectionDropdown() {
        if (!collectionDropdownOpen) {
            return;
        }
        collectionDropdownOpen = false;
        renderCollectionControls();
    }

    function updateNavUI() {
        renderLeftFilters();
        renderFooterFilters();
        renderCollectionControls();
        scrollActiveCategoryIntoView();
    }

    function scrollActiveCategoryIntoView() {
        if (window.innerWidth > MOBILE_MAX_WIDTH) {
            return;
        }

        filterStartEls.forEach((groupEl) => {
            const activeLink = groupEl.querySelector(".filter-bar__link--active");
            if (!activeLink) {
                return;
            }

            requestAnimationFrame(() => {
                const linkStart = activeLink.offsetLeft;
                const linkEnd = linkStart + activeLink.offsetWidth;
                const viewStart = groupEl.scrollLeft;
                const viewEnd = viewStart + groupEl.clientWidth;

                if (linkStart < viewStart) {
                    groupEl.scrollTo({ left: linkStart, behavior: "smooth" });
                } else if (linkEnd > viewEnd) {
                    groupEl.scrollTo({ left: linkEnd - groupEl.clientWidth, behavior: "smooth" });
                }
            });
        });
    }

    function syncURL() {
        if (!isCatalogPage) {
            return;
        }

        const url = new URL(window.location.href);

        if (currentView === "creators") {
            url.searchParams.set("view", "creators");
        } else {
            url.searchParams.delete("view");
        }

        if (activeCategory !== "all" && currentView === "objects") {
            url.searchParams.set("category", activeCategory);
        } else {
            url.searchParams.delete("category");
        }

        if (activeCollection !== DEFAULT_COLLECTION) {
            url.searchParams.set("collection", activeCollection);
        } else {
            url.searchParams.delete("collection");
        }

        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }

    function markNavIntroSeen() {
        try {
            sessionStorage.setItem("timeless-nav-intro-seen", "1");
        } catch (error) {}
        document.documentElement.classList.add("nav-intro-seen");
    }

    function dispatchFilterChange() {
        markNavIntroSeen();
        document.dispatchEvent(
            new CustomEvent("filter:change", {
                detail: {
                    view: currentView,
                    category: activeCategory,
                    collection: activeCollection,
                },
            })
        );
    }

    function applyFilter({ view, category, collection }, { navigate = !isCatalogPage } = {}) {
        if (view !== undefined) {
            currentView = view;
        }
        if (category !== undefined) {
            activeCategory = category;
        }
        if (collection !== undefined) {
            activeCollection = collection;
        }

        updateNavUI();

        if (navigate) {
            const url = new URL("index.html", window.location.href);
            if (currentView === "creators") {
                url.searchParams.set("view", "creators");
            }
            if (activeCategory !== "all" && currentView === "objects") {
                url.searchParams.set("category", activeCategory);
            }
            if (activeCollection !== DEFAULT_COLLECTION) {
                url.searchParams.set("collection", activeCollection);
            }
            window.location.href = `${url.pathname}${url.search}`;
            return;
        }

        syncURL();
        dispatchFilterChange();
    }

    function handleFilterBarClick(event) {
        event.stopPropagation();

        const categoryButton = event.target.closest("[data-category]");
        if (categoryButton) {
            closeCollectionDropdown();
            applyFilter({
                view: "objects",
                category: categoryButton.dataset.category || "all",
            });
            return;
        }

        const viewButton = event.target.closest("[data-view]");
        if (viewButton) {
            closeCollectionDropdown();
            applyFilter({ view: viewButton.dataset.view || "creators" });
            return;
        }

        if (event.target.closest(".collection-dropdown__trigger")) {
            collectionDropdownOpen = !collectionDropdownOpen;
            requestAnimationFrame(() => {
                renderCollectionControls();
                document.dispatchEvent(new CustomEvent("filter:ui-change"));
            });
            return;
        }

        const collectionButton = event.target.closest("[data-collection]");
        if (collectionButton) {
            collectionDropdownOpen = false;
            applyFilter({ collection: collectionButton.dataset.collection || DEFAULT_COLLECTION });
        }
    }

    filterBarEls.forEach((filterBarEl) => {
        filterBarEl.addEventListener("click", handleFilterBarClick);
    });

    document.addEventListener("click", (event) => {
        if (!collectionDropdownOpen) {
            return;
        }
        if (!event.target.closest("[data-collection-dropdown]")) {
            closeCollectionDropdown();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCollectionDropdown();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > MOBILE_MAX_WIDTH && collectionDropdownOpen) {
            closeCollectionDropdown();
        }
    });

    document.addEventListener("detail:context", (event) => {
        if (isCatalogPage) {
            return;
        }

        const { category, type } = event.detail || {};
        applyFilter(
            {
                view: type === "creator" ? "creators" : "objects",
                category: category || "all",
            },
            { navigate: false }
        );
    });

    updateNavUI();

    document.dispatchEvent(
        new CustomEvent("filter:ready", {
            detail: {
                view: currentView,
                category: activeCategory,
                collection: activeCollection,
            },
        })
    );
})();
