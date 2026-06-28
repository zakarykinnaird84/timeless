(function () {
    const LEFT_FILTERS = [
        { type: "all", value: "all", label: "All" },
        { type: "category", value: "furniture", label: "Furniture" },
        { type: "category", value: "audio", label: "Audio" },
        { type: "category", value: "studio", label: "Workspace" },
        { type: "category", value: "gaming", label: "Gaming" },
        { type: "category", value: "collectable", label: "Collectable" },
        { type: "category", value: "fashion", label: "Fashion" },
    ];

    const headerEl = document.querySelector(".site-header");
    const filterBarEl = document.querySelector(".filter-bar");
    const filterStartEl = document.querySelector(".filter-bar__group--start");
    const catalogEl = document.getElementById("catalog");
    const isCatalogPage = Boolean(catalogEl);

    if (!headerEl || !filterBarEl || !filterStartEl) {
        return;
    }

    const COLLECTIONS = new Set(["new", "featured", "editor-picks"]);
    const DEFAULT_COLLECTION = "featured";
    const params = new URLSearchParams(window.location.search);
    let currentView = params.get("view") === "creators" ? "creators" : "objects";
    let activeCategory = params.get("category") || "all";
    const collectionParam = params.get("collection");
    let activeCollection = COLLECTIONS.has(collectionParam) ? collectionParam : DEFAULT_COLLECTION;

    function renderLeftFilters() {
        filterStartEl.innerHTML = LEFT_FILTERS.map((item) => {
            const isActive =
                item.type === "all"
                    ? currentView === "objects" && activeCategory === "all"
                    : currentView === "objects" && activeCategory === item.value;

            if (item.type === "all") {
                return `<button type="button" class="filter-bar__link${isActive ? " filter-bar__link--active" : ""}" data-category="all">All</button>`;
            }

            return `<button type="button" class="filter-bar__link${isActive ? " filter-bar__link--active" : ""}" data-category="${item.value}">${item.label}</button>`;
        }).join("");
    }

    function updateNavUI() {
        renderLeftFilters();

        filterBarEl.querySelectorAll("[data-collection]").forEach((el) => {
            el.classList.toggle("filter-bar__link--active", el.dataset.collection === activeCollection);
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

    function dispatchFilterChange() {
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

    filterBarEl.addEventListener("click", (event) => {
        const categoryButton = event.target.closest("[data-category]");
        if (categoryButton) {
            applyFilter({
                view: "objects",
                category: categoryButton.dataset.category || "all",
            });
            return;
        }

        const collectionButton = event.target.closest("[data-collection]");
        if (collectionButton) {
            applyFilter({ collection: collectionButton.dataset.collection || "new" });
        }
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
