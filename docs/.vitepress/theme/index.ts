import DefaultTheme from "vitepress/theme";
import "katex/dist/katex.min.css";
import "./custom.css";
import PackageManagerTabs from "./components/PackageManagerTabs.vue";
import PyPIReleases from "./components/PyPIReleases.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("PackageManagerTabs", PackageManagerTabs);
    app.component("PyPIReleases", PyPIReleases);
  },
};
