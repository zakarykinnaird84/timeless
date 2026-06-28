(function () {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navIntroKey = "timeless-nav-intro-seen";
    const compactTopMaxHeight = 700;

    function lockTopScreenHeight() {
        const height = Math.round(window.innerHeight);
        document.documentElement.style.setProperty("--top-screen-height", `${height}px`);
        document.documentElement.classList.toggle("compact-top", height <= compactTopMaxHeight);
    }

    lockTopScreenHeight();
    window.addEventListener("resize", lockTopScreenHeight);
    window.addEventListener("orientationchange", () => {
        window.setTimeout(lockTopScreenHeight, 150);
    });

    function isPageReload() {
        const entry = performance.getEntriesByType("navigation")[0];
        return entry?.type === "reload";
    }

    function hasNavIntroSeen() {
        try {
            return sessionStorage.getItem(navIntroKey) === "1";
        } catch (error) {
            return false;
        }
    }

    function shouldPlayCatalogIntro() {
        if (prefersReducedMotion) {
            return false;
        }
        if (isPageReload()) {
            return true;
        }
        return !hasNavIntroSeen();
    }

    function markNavIntroSeen() {
        try {
            sessionStorage.setItem(navIntroKey, "1");
        } catch (error) {}
        document.documentElement.classList.add("nav-intro-seen");
    }

    function getDevelopDurationMs() {
        const rootStyles = getComputedStyle(document.documentElement);
        const duration =
            (parseFloat(rootStyles.getPropertyValue("--hero-develop-duration")) || 6.5) * 1000;
        const delay = (parseFloat(rootStyles.getPropertyValue("--hero-develop-delay")) || 0.7) * 1000;
        return duration + delay;
    }

    function finishHeroDevelop(hero) {
        hero.classList.remove("is-developing");
        hero.classList.add("is-developed");
    }

    function startHeroDevelop(hero) {
        hero.classList.remove("is-developed", "is-developing", "is-visible");
        void hero.offsetWidth;
        hero.classList.add("is-visible", "is-developing");
    }

    function bindHeroDevelop(hero) {
        if (!hero || hero.classList.contains("is-developed")) {
            return;
        }

        if (prefersReducedMotion) {
            finishHeroDevelop(hero);
            return;
        }

        const isIntroHero = hero.dataset.intro === "true";

        startHeroDevelop(hero);

        const developDurationMs = getDevelopDurationMs();
        let pendingAnimations = 0;
        let finished = false;

        const onComplete = () => {
            if (finished) {
                return;
            }
            finished = true;
            if (isIntroHero) {
                markNavIntroSeen();
            }
            finishHeroDevelop(hero);
        };

        const attachAnimationListeners = () => {
            const animatedTargets = hero.querySelectorAll(".hero-image, .hero-video, .hero-develop");

            animatedTargets.forEach((target) => {
                const { animationName } = getComputedStyle(target);
                if (!animationName || animationName === "none") {
                    return;
                }

                pendingAnimations += 1;
                target.addEventListener(
                    "animationend",
                    (event) => {
                        if (event.target !== target) {
                            return;
                        }
                        pendingAnimations -= 1;
                        if (pendingAnimations <= 0) {
                            onComplete();
                        }
                    },
                    { once: true }
                );
            });

            if (pendingAnimations === 0) {
                window.setTimeout(onComplete, developDurationMs);
            } else {
                window.setTimeout(onComplete, developDurationMs + 150);
            }
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(attachAnimationListeners);
        });
    }

    function observeHeroSections() {
        const catalog = document.getElementById("catalog");
        if (!catalog) {
            return;
        }

        catalog.querySelectorAll(".hero-media.is-developed, .hero-media.is-developing").forEach((hero) => {
            hero.classList.remove("is-developed", "is-developing", "is-visible");
        });

        const heroes = catalog.querySelectorAll(".object-screen--featured .hero-media");

        if (!shouldPlayCatalogIntro()) {
            markNavIntroSeen();
            heroes.forEach(finishHeroDevelop);
            return;
        }

        const introHero = catalog.querySelector(".object-screen--featured .hero-media[data-intro='true']");
        if (!introHero) {
            markNavIntroSeen();
            heroes.forEach(finishHeroDevelop);
            return;
        }

        if (prefersReducedMotion) {
            heroes.forEach(finishHeroDevelop);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const hero = entry.target;
                    if (hero.classList.contains("is-developed") || hero.dataset.intro === "true") {
                        observer.unobserve(hero);
                        return;
                    }

                    bindHeroDevelop(hero);
                    observer.unobserve(hero);
                });
            },
            {
                threshold: 0.35,
                root: null,
                rootMargin: "0px",
            }
        );

        heroes.forEach((hero) => {
            if (hero.dataset.intro === "true") {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => bindHeroDevelop(hero));
                });
                return;
            }
            observer.observe(hero);
        });
    }

    function syncCatalogHeaderHeight() {
        const header =
            document.querySelector(".page--catalog .site-header") ||
            document.querySelector(".page--detail.is-header-open .site-header");
        if (!header) {
            return;
        }

        const height = Math.ceil(header.getBoundingClientRect().height);
        if (height > 0) {
            document.documentElement.style.setProperty("--site-header-height", `${height}px`);
        }
    }

    function syncFooterClosingHeight() {
        const closing =
            document.querySelector(".site-footer__closing--catalog") ||
            document.querySelector(".page--about-timeless .site-footer__closing");
        if (!closing) {
            return;
        }

        const height = Math.ceil(closing.getBoundingClientRect().height);
        if (height > 0) {
            document.documentElement.style.setProperty("--footer-closing-height", `${height}px`);
        }
    }

    function initCatalogPage() {
        syncCatalogHeaderHeight();
        window.addEventListener("resize", syncCatalogHeaderHeight);
        document.addEventListener("filter:ready", () => {
            requestAnimationFrame(syncCatalogHeaderHeight);
        });
        document.addEventListener("filter:ui-change", syncCatalogHeaderHeight);

        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");
            if (!link || link.target === "_blank") {
                return;
            }
            const href = link.getAttribute("href") || "";
            if (href.includes("detail.html") || href.includes("about.html")) {
                markNavIntroSeen();
            }
        });

        document.addEventListener("catalog:rendered", () => {
            observeHeroSections();
            syncCatalogHeaderHeight();
        });
    }

    function bindDetailHeroDevelop(heroMedia) {
        if (!heroMedia) {
            return;
        }

        const img = heroMedia.querySelector(".detail-hero__image, .hero-image");
        if (!img) {
            finishHeroDevelop(heroMedia);
            return;
        }

        const start = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => bindHeroDevelop(heroMedia));
            });
        };

        if (img.complete && img.naturalWidth) {
            start();
        } else {
            img.addEventListener("load", start, { once: true });
        }
    }

    function initDetailPage() {
        markNavIntroSeen();

        const page = document.querySelector(".page--detail");
        let detailNavBound = false;

        function setDetailHeaderOpen(open) {
            if (!page) {
                return;
            }

            const header = document.querySelector(".page--detail .site-header");
            const isOpen = page.classList.contains("is-header-open");

            if (open === isOpen) {
                return;
            }

            if (open) {
                syncCatalogHeaderHeight();
            }

            page.classList.toggle("is-header-open", open);

            const dot = document.querySelector(".detail-header__dot");
            if (dot) {
                dot.setAttribute("aria-expanded", open ? "true" : "false");
                dot.setAttribute("aria-label", open ? "Close browse menu" : "Open browse menu");
            }

            if (header && open) {
                header.addEventListener(
                    "transitionend",
                    () => {
                        header.style.willChange = "";
                    },
                    { once: true }
                );
                header.style.willChange = "transform, opacity";
            }
        }

        function bindDetailHeaderNav() {
            if (detailNavBound) {
                return;
            }

            const dot = document.querySelector(".detail-header__dot");
            if (!dot || !page) {
                return;
            }

            detailNavBound = true;

            dot.addEventListener("click", (event) => {
                event.stopPropagation();
                setDetailHeaderOpen(!page.classList.contains("is-header-open"));
            });

            document.addEventListener("click", (event) => {
                if (!page.classList.contains("is-header-open")) {
                    return;
                }

                if (
                    event.target.closest(".site-header") ||
                    event.target.closest(".detail-header__dot") ||
                    event.target.closest(".filter-bar")
                ) {
                    return;
                }

                setDetailHeaderOpen(false);
            });

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    setDetailHeaderOpen(false);
                }
            });

            document.addEventListener("filter:ui-change", () => {
                if (page.classList.contains("is-header-open")) {
                    requestAnimationFrame(syncCatalogHeaderHeight);
                }
            });

            window.addEventListener("resize", () => {
                if (page.classList.contains("is-header-open")) {
                    syncCatalogHeaderHeight();
                }
            });
        }

        document.addEventListener("detail:rendered", () => {
            bindDetailHeaderNav();
            const heroMedia = document.querySelector(".detail-hero__media.hero-media");
            bindDetailHeroDevelop(heroMedia);
        });
    }

    if (document.getElementById("catalog")) {
        initCatalogPage();
    }

    if (document.getElementById("detail-root")) {
        initDetailPage();
    }

    if (document.querySelector(".page--about-timeless, .page--legal")) {
        markNavIntroSeen();
    }

    function initFooterReveal() {
        const footerTargets = document.querySelectorAll(".site-footer__text");
        if (!footerTargets.length) {
            return;
        }

        if (prefersReducedMotion) {
            footerTargets.forEach((target) => target.classList.add("is-visible"));
            return;
        }

        const footerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add("is-visible");
                    footerObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
        );

        footerTargets.forEach((target) => footerObserver.observe(target));
    }

    initFooterReveal();

    syncFooterClosingHeight();
    window.addEventListener("resize", syncFooterClosingHeight);
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => requestAnimationFrame(syncFooterClosingHeight));
    }

    document.querySelectorAll(".about-copy .story-line").forEach((line, index) => {
        line.style.setProperty("--reveal-delay", `${index * 150}ms`);
    });

    const aboutRevealTargets = document.querySelectorAll(".about-copy .story-line, .about-hero.hero-media");
    if (aboutRevealTargets.length && !prefersReducedMotion) {
        const aboutObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add("is-visible");
                    aboutObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px 15% 0px" }
        );
        aboutRevealTargets.forEach((el) => aboutObserver.observe(el));
    }
})();
