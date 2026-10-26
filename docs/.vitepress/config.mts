import { defineConfig } from "vitepress";
import markdownItKatex from "@iktakahiro/markdown-it-katex";

const base = "/FEZdocs/";

// Each tool keeps its own accent (FEZrs green, FEZfm blue), applied only on
// that tool's pages; see the .tool-* rules in theme/custom.css.
const toolPageClass: Record<string, string> = {
  "libraries/fezrs/": "tool-rs",
  "fezfm/": "tool-fm",
};

export default defineConfig({
  title: "FEZdocs",
  description: "Documentation for FEZtool, free and easy tools for Earth sciences.",

  lang: "en-US",

  base,

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
    ["meta", { property: "og:site_name", content: "FEZtool" }],
    ["meta", { property: "og:image", content: `${base}icon-512.png` }],
  ],

  transformPageData(pageData) {
    const match = Object.keys(toolPageClass).find((prefix) =>
      pageData.relativePath.startsWith(prefix)
    );
    if (match && !pageData.frontmatter.pageClass) {
      pageData.frontmatter.pageClass = toolPageClass[match];
    }
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
            items: [{ text: "Earthquake monitor", link: "/fezfm/" }],
          },
        ],
      },

      { text: "Licensing", link: "/licensing" },
      { text: "FEZteam", link: "/team" },
      { text: "Stay in Touch", link: "/contact" },
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

    footer: {
      message: "Free &amp; Easy tools for Earth sciences. Released under the Apache License 2.0.",
      copyright: "Copyright © 2026 FEZtool",
    },
  },

  markdown: {
    config(md) {
      md.use(markdownItKatex);
    },
  },
});
