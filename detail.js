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

    function fitDetailHeroImage(img) {
        const hero = img.closest(".detail-hero");
        if (!hero) {
            return;
        }

        const fit = () => {
            const available = hero.clientWidth;
            if (!img.naturalWidth || !available) {
                return;
            }

            if (img.naturalWidth < available) {
                img.style.width = "100%";
                img.style.height = "auto";
                img.style.maxWidth = "none";
            } else {
                img.style.width = "auto";
                img.style.height = "auto";
                img.style.maxWidth = "100%";
            }
        };

        if (img.complete) {
            fit();
        } else {
            img.addEventListener("load", fit, { once: true });
        }

        if (!img.dataset.fitBound) {
            img.dataset.fitBound = "true";
            window.addEventListener("resize", fit);
        }
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
                ? `<span class="detail-brand__external" aria-hidden="true"><img src="assets/big-external-link.svg" alt=""></span>`
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

            const heroImage = root.querySelector(".detail-hero__image");
            if (heroImage) {
                fitDetailHeroImage(heroImage);
            }

            document.dispatchEvent(new CustomEvent("detail:rendered"));
        })
        .catch(() => {
            root.innerHTML = `<div class="detail-not-found"><h1 class="detail-title">Error</h1><p class="detail-copy"><a href="index.html">Back to catalog</a></p></div>`;
        });
})();
