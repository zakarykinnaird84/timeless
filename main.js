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

    function markNavIntroSeen() {
        try {
            sessionStorage.setItem(navIntroKey, "1");
        } catch (error) {}
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

        if (isIntroHero) {
            markNavIntroSeen();
        }

        startHeroDevelop(hero);

        const developDurationMs = getDevelopDurationMs();
        let pendingAnimations = 0;
        let finished = false;

        const onComplete = () => {
            if (finished) {
                return;
            }
            finished = true;
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

    function initCatalogPage() {
        document.addEventListener("catalog:rendered", () => {
            observeHeroSections();
        });
    }

    function initDetailPage() {
        document.addEventListener("detail:rendered", () => {
            const hero = document.querySelector(".detail-hero.hero-media");
            requestAnimationFrame(() => {
                requestAnimationFrame(() => bindHeroDevelop(hero));
            });
        });
    }

    if (document.getElementById("catalog")) {
        initCatalogPage();
    }

    if (document.getElementById("detail-root")) {
        initDetailPage();
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
