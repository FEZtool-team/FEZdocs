import { defineConfig } from "vitepress";
import markdownItKatex from "@iktakahiro/markdown-it-katex";

export default defineConfig({
  title: "FEZdocs",
  description: "Centralized FEZtool tools documentation.",

  lang: "en-US",

  base: "/FEZdocs/",

  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/FEZtool-white-logo.png" },
    ],
  ],

  themeConfig: {
    logo: {
      light: "/FEZtool-black-logo.png",
      dark: "/FEZtool-white-logo.png",
    },
    siteTitle: "",
    nav: [
      { text: "Home", link: "/" },

      {
        text: "Libraries",
        items: [
          {
            text: "FEZrs",
            items: [
              { text: "Overview", link: "/libraries/fezrs/" },
              {
                text: "Change Detection",
                link: "/libraries/fezrs/change-detection",
              },
              { text: "Clustering", link: "/libraries/fezrs/clustering" },
              { text: "Filters", link: "/libraries/fezrs/filters" },
              { text: "GLCM", link: "/libraries/fezrs/glcm" },
              { text: "HSV", link: "/libraries/fezrs/hsv" },
              {
                text: "Image Enhancement",
                link: "/libraries/fezrs/image-enhancement",
              },
              { text: "Import Tools", link: "/libraries/fezrs/import-tools" },
              { text: "Mosaic", link: "/libraries/fezrs/mosaic" },
              { text: "PCA", link: "/libraries/fezrs/pca" },
              {
                text: "Spectral Indices",
                link: "/libraries/fezrs/spectral-indices",
              },
              {
                text: "Spectral Profile",
                link: "/libraries/fezrs/spectral-profile",
              },
              { text: "SVM", link: "/libraries/fezrs/svm" },
            ],
          },
        ],
      },

      { text: "Licenses", link: "/licenses" },
      { text: "Stay in Touch", link: "/contact" },
    ],

    sidebar: {
      "/libraries/fezrs/": [
        {
          text: "FEZrs",
          items: [
            { text: "Overview", link: "/libraries/fezrs/" },
            {
              text: "Change Detection",
              link: "/libraries/fezrs/change-detection",
            },
            { text: "Clustering", link: "/libraries/fezrs/clustering" },
            { text: "Filters", link: "/libraries/fezrs/filters" },
            { text: "GLCM", link: "/libraries/fezrs/glcm" },
            { text: "HSV", link: "/libraries/fezrs/hsv" },
            {
              text: "Image Enhancement",
              link: "/libraries/fezrs/image-enhancement",
            },
            { text: "Import Tools", link: "/libraries/fezrs/import-tools" },
            { text: "Mosaic", link: "/libraries/fezrs/mosaic" },
            { text: "PCA", link: "/libraries/fezrs/pca" },
            {
              text: "Spectral Indices",
              link: "/libraries/fezrs/spectral-indices",
            },
            {
              text: "Spectral Profile",
              link: "/libraries/fezrs/spectral-profile",
            },
            { text: "SVM", link: "/libraries/fezrs/svm" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/mhdned",
      },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Built with VitePress",
      copyright: "Copyright © 2026 FEZtool",
    },
  },

  markdown: {
    config(md) {
      md.use(markdownItKatex);
    },
  },
});
