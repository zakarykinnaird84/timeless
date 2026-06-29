#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const site = JSON.parse(fs.readFileSync(path.join(root, "config/site.json"), "utf8"));
const objects = JSON.parse(fs.readFileSync(path.join(root, "data/objects.json"), "utf8"));
const creators = JSON.parse(fs.readFileSync(path.join(root, "data/creators.json"), "utf8"));

const origin = site.origin.replace(/\/$/, "");
const staticPages = ["/", "/about.html", "/terms.html", "/privacy.html"];

function detailUrl(slug, type) {
    return `/detail.html?slug=${encodeURIComponent(slug)}&type=${type}`;
}

const urls = [
    ...staticPages.map((page) => ({ loc: `${origin}${page}` })),
    ...objects.filter((item) => item.published !== false).map((item) => ({ loc: `${origin}${detailUrl(item.slug, "object")}` })),
    ...creators.filter((item) => item.published !== false).map((item) => ({ loc: `${origin}${detailUrl(item.slug, "creator")}` })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc }) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "robots.txt"), robots);

console.log(`Generated sitemap with ${urls.length} URLs for ${origin}`);
