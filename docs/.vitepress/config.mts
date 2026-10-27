import { defineConfig, type HeadConfig, type PageData } from "vitepress";
import markdownItKatex from "@iktakahiro/markdown-it-katex";

const base = "/FEZdocs/";

// FEZdocs stays on github.io; canonical, Open Graph and sitemap URLs are absolute.
const siteUrl = `https://feztool-team.github.io${base}`;
const siteTitle = "FEZdocs";
const siteDescription =
  "Documentation for FEZtool's open-source Earth-science tools: the FEZrs Python package for remote sensing and the FEZfm earthquake monitor.";
const ogImage = { url: `${siteUrl}og/fezdocs.png`, width: "1200", height: "630", alt: "FEZdocs: documentation for FEZtool" };

// schema.org @ids published on feztool.com (FEZhome data/schema.ts). Keep them unchanged.
const ids = {
  organization: "https://feztool.com/#organization",
  fezrs: "https://feztool.com/fezrs/#software",
  fezfm: "https://feztool.com/fezfm/#software",
  website: `${siteUrl}#website`,
};

// Each tool keeps its own accent (FEZrs green, FEZfm blue), applied only on
// that tool's pages; see the .tool-* rules in theme/custom.css. Its pages also
// get a title suffix and TechArticle JSON-LD about that tool.
const tools = [
  { prefix: "libraries/fezrs/", pageClass: "tool-rs", titleTemplate: ":title | FEZrs docs", about: ids.fezrs },
  { prefix: "fezfm/", pageClass: "tool-fm", titleTemplate: ":title | FEZfm docs", about: ids.fezfm },
];

const pageUrl = (relativePath: string) =>
  siteUrl + relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");

// Same rule VitePress uses for <title>, so og:title matches it.
function fullTitle(page: PageData) {
  const template = page.titleTemplate ?? `:title | ${siteTitle}`;
  if (template === false) return page.title;
  return String(template).replace(/:title/g, page.title);
}

const jsonLd = (data: object): HeadConfig => [
  "script",
  { type: "application/ld+json" },
  JSON.stringify({ "@context": "https://schema.org", ...data }),
];

function seoHead(page: PageData, about?: string): HeadConfig[] {
  const url = pageUrl(page.relativePath);
  const title = fullTitle(page);
  const description = page.description || siteDescription;
  const isHome = page.relativePath === "index.md";

  const head: HeadConfig[] = [
    ["link", { rel: "canonical", href: url }],
    ["meta", { property: "og:type", content: isHome ? "website" : "article" }],
    ["meta", { property: "og:url", content: url }],
    ["meta", { property: "og:title", content: title }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:image", content: ogImage.url }],
    ["meta", { property: "og:image:width", content: ogImage.width }],
    ["meta", { property: "og:image:height", content: ogImage.height }],
    ["meta", { property: "og:image:alt", content: ogImage.alt }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: title }],
    ["meta", { name: "twitter:description", content: description }],
    ["meta", { name: "twitter:image", content: ogImage.url }],
  ];

  if (isHome) {
    head.push(
      jsonLd({
        "@type": "WebSite",
        "@id": ids.website,
        name: siteTitle,
        url: siteUrl,
        description: siteDescription,
        inLanguage: "en",
        about: [{ "@id": ids.fezrs }, { "@id": ids.fezfm }],
        publisher: { "@id": ids.organization },
      })
    );
  } else if (about) {
    // lastUpdated is NaN for files git does not track yet.
    const modified = Number.isFinite(page.lastUpdated) && page.lastUpdated! > 0;
    head.push(
      jsonLd({
        "@type": "TechArticle",
        headline: page.title,
        description,
        url,
        mainEntityOfPage: url,
        image: ogImage.url,
        inLanguage: "en",
        ...(modified ? { dateModified: new Date(page.lastUpdated!).toISOString() } : {}),
        isPartOf: { "@id": ids.website },
        about: { "@id": about },
        publisher: { "@id": ids.organization },
      })
    );
  }

  return head;
}

export default defineConfig({
  title: siteTitle,
  titleTemplate: `:title | ${siteTitle}`,
  description: siteDescription,

  lang: "en-US",

  base,

  // /libraries/fezrs/svm instead of svm.html; GitHub Pages serves both, and
  // feztool.com already links to the extensionless URLs.
  cleanUrls: true,

  lastUpdated: true,

  sitemap: {
    hostname: siteUrl,
  },

  // VitePress does not prefix head links with the base, so these carry it.
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
    ["link", { rel: "icon", type: "image/x-icon", href: `${base}favicon.ico`, sizes: "32x32" }],
    ["link", { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
      },
    ],
    ["meta", { property: "og:site_name", content: siteTitle }],
    ["meta", { property: "og:locale", content: "en_US" }],
  ],

  // Canonical, Open Graph, Twitter and JSON-LD tags per page. Done here rather
  // than in transformHead so they also show up in `docs:dev`.
  transformPageData(pageData) {
    const tool = tools.find(({ prefix }) => pageData.relativePath.startsWith(prefix));
    if (tool) {
      pageData.frontmatter.pageClass ??= tool.pageClass;
      pageData.titleTemplate ??= tool.titleTemplate;
    }
    pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...seoHead(pageData, tool?.about)];
  },

  themeConfig: {
    // FEZ mark plus FEZDOCS, drawn in the FEZTOOL lettering (FEZhome data/logo.ts).
    logo: {
      light: "/fezdocs-logo-dark.svg",
      dark: "/fezdocs-logo-light.svg",
      alt: "FEZdocs",
    },

    siteTitle: false,

    nav: [
      { text: "Home", link: "/" },

      {
        text: "Tools",
        items: [
          {
            text: "FEZrs",
            items: [
              { text: "Overview", link: "/libraries/fezrs/" },
              { text: "FEZrs on feztool.com", link: "https://feztool.com/fezrs/" },
              {
                text: "Installation",
                link: "/libraries/fezrs/installation",
              },
              {
                text: "Modules",
                link: "/libraries/fezrs/change-detection",
                items: [
                  {
                    text: "Change Detection",
                    link: "/libraries/fezrs/change-detection",
                  },
                  {
                    text: "Clustering",
                    link: "/libraries/fezrs/clustering",
                  },
                  {
                    text: "Filters",
                    link: "/libraries/fezrs/filters",
                  },
                  {
                    text: "GLCM",
                    link: "/libraries/fezrs/glcm",
                  },
                  {
                    text: "HSV",
                    link: "/libraries/fezrs/hsv",
                  },
                  {
                    text: "Image Enhancement",
                    link: "/libraries/fezrs/image-enhancement",
                  },
                  {
                    text: "Import Tools",
                    link: "/libraries/fezrs/import-tools",
                  },
                  {
                    text: "Mosaic",
                    link: "/libraries/fezrs/mosaic",
                  },
                  {
                    text: "PCA",
                    link: "/libraries/fezrs/pca",
                  },
                  {
                    text: "Spectral Indices",
                    link: "/libraries/fezrs/spectral-indices",
                  },
                  {
                    text: "Spectral Profile",
                    link: "/libraries/fezrs/spectral-profile",
                  },
                  {
                    text: "SVM",
                    link: "/libraries/fezrs/svm",
                  },
                ],
              },
            ],
          },
          {
            text: "FEZfm",
            items: [
              { text: "Documentation", link: "/fezfm/" },
              { text: "Open the monitor", link: "https://fezfm.feztool.com/" },
            ],
          },
        ],
      },

      // Grouped so the bar still fits between 768px and 960px.
      {
        text: "About",
        items: [
          { text: "Team", link: "/team" },
          { text: "Licensing", link: "/licensing" },
          { text: "Stay in Touch", link: "/contact" },
        ],
      },
      { text: "feztool.com", link: "https://feztool.com/" },
    ],

    sidebar: {
      "/fezfm/": [
        {
          text: "FEZfm",
          items: [
            { text: "Overview", link: "/fezfm/" },
            { text: "Sources", link: "/fezfm/#sources" },
            { text: "How it works", link: "/fezfm/#how-it-works" },
            { text: "Flags", link: "/fezfm/#flags" },
            { text: "Data and downloads", link: "/fezfm/#data-and-downloads" },
            { text: "Run locally", link: "/fezfm/#run-locally" },
            { text: "Publish on GitHub Pages", link: "/fezfm/#publish-on-github-pages" },
            { text: "Limits", link: "/fezfm/#limits" },
            { text: "Credits and license", link: "/fezfm/#credits-and-license" },
          ],
        },
      ],

      "/libraries/fezrs/": [
        {
          text: "FEZrs",
          items: [
            {
              text: "Overview",
              link: "/libraries/fezrs/",
            },
            {
              text: "Contributors",
              link: "/libraries/fezrs/#contributors",
            },
            {
              text: "Contributing",
              link: "/libraries/fezrs/#contributing",
            },
            {
              text: "Installation",
              link: "/libraries/fezrs/installation",
            },
          ],
        },

        {
          text: "Modules",
          items: [
            {
              text: "Change Detection",
              link: "/libraries/fezrs/change-detection",
            },
            {
              text: "Clustering",
              link: "/libraries/fezrs/clustering",
            },
            {
              text: "Filters",
              link: "/libraries/fezrs/filters",
            },
            {
              text: "GLCM",
              link: "/libraries/fezrs/glcm",
            },
            {
              text: "HSV",
              link: "/libraries/fezrs/hsv",
            },
            {
              text: "Image Enhancement",
              link: "/libraries/fezrs/image-enhancement",
            },
            {
              text: "Import Tools",
              link: "/libraries/fezrs/import-tools",
            },
            {
              text: "Mosaic",
              link: "/libraries/fezrs/mosaic",
            },
            {
              text: "PCA",
              link: "/libraries/fezrs/pca",
            },
            {
              text: "Spectral Indices",
              link: "/libraries/fezrs/spectral-indices",
            },
            {
              text: "Spectral Profile",
              link: "/libraries/fezrs/spectral-profile",
            },
            {
              text: "SVM",
              link: "/libraries/fezrs/svm",
            },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/FEZtool-team/",
      },
    ],

    search: {
      provider: "local",
    },

    // Shown on pages without a sidebar (home, team, licensing, contact).
    footer: {
      message: [
        "Free &amp; Easy tools for Earth sciences.",
        '<a href="https://feztool.com/">feztool.com</a>',
        '<a href="https://fezfm.feztool.com/">FEZfm monitor</a>',
        '<a href="https://github.com/FEZtool-team">GitHub</a>',
      ].join(" · "),
      copyright: "Released under the Apache License 2.0. Copyright © 2026 FEZtool",
    },
  },

  markdown: {
    config(md) {
      md.use(markdownItKatex);
    },
  },
});
