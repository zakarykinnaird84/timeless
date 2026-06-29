(function () {
    const SITE_CONFIG_PATH = "config/site.json";

    let siteConfigPromise = null;

    function getSiteConfig() {
        if (!siteConfigPromise) {
            siteConfigPromise = fetch(SITE_CONFIG_PATH)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Site config unavailable");
                    }
                    return response.json();
                })
                .catch(() => ({
                    origin: window.location.origin,
                    name: "Timeless Objects",
                    description: "Design-led things that outlast trends.",
                    ogImage: "images/share/og-default.webp",
                    twitterCard: "summary_large_image",
                }));
        }

        return siteConfigPromise;
    }

    function absoluteUrl(origin, path) {
        if (!path) {
            return origin;
        }

        if (/^https?:\/\//.test(path)) {
            return path;
        }

        return `${origin.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    }

    function setNamedMeta(name, content) {
        if (!content) {
            return;
        }

        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("name", name);
            document.head.appendChild(tag);
        }

        tag.setAttribute("content", content);
    }

    function setPropertyMeta(property, content) {
        if (!content) {
            return;
        }

        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("property", property);
            document.head.appendChild(tag);
        }

        tag.setAttribute("content", content);
    }

    function setCanonical(url) {
        if (!url) {
            return;
        }

        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "canonical");
            document.head.appendChild(link);
        }

        link.setAttribute("href", url);
    }

    function setPageMeta(options) {
        const {
            title,
            description,
            url,
            image,
            imageWidth,
            imageHeight,
            imageAlt,
            type = "website",
            siteName,
            twitterCard,
        } = options;

        if (title) {
            document.title = title;
        }

        if (description) {
            setNamedMeta("description", description);
            setPropertyMeta("og:description", description);
            setNamedMeta("twitter:description", description);
        }

        if (url) {
            setCanonical(url);
            setPropertyMeta("og:url", url);
        }

        if (title) {
            setPropertyMeta("og:title", title);
            setNamedMeta("twitter:title", title);
        }

        if (siteName) {
            setPropertyMeta("og:site_name", siteName);
        }

        setPropertyMeta("og:type", type);

        if (image) {
            setPropertyMeta("og:image", image);
            setNamedMeta("twitter:image", image);
        }

        if (imageWidth) {
            setPropertyMeta("og:image:width", String(imageWidth));
        }

        if (imageHeight) {
            setPropertyMeta("og:image:height", String(imageHeight));
        }

        if (imageAlt) {
            setPropertyMeta("og:image:alt", imageAlt);
            setNamedMeta("twitter:image:alt", imageAlt);
        }

        if (twitterCard) {
            setNamedMeta("twitter:card", twitterCard);
        }
    }

    function summarizeDescription(text, maxLength = 160) {
        if (!text) {
            return "";
        }

        const firstParagraph = text.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
        if (firstParagraph.length <= maxLength) {
            return firstParagraph;
        }

        return `${firstParagraph.slice(0, maxLength - 1).trim()}…`;
    }

    window.TimelessSiteMeta = {
        getSiteConfig,
        absoluteUrl,
        setPageMeta,
        summarizeDescription,
    };
})();
