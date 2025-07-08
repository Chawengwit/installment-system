import { capitalize } from './utils/AppUtils.js';

class App {
    constructor() {
        this.$mainContent = $("#main-content");
        this.loadedScripts = {};
        this.currentPageModule = null;
    }

    init() {
        $("#nav-container").load("/nav.html", () => {
            this.setupNavigation();
            const path = this.normalizePath(window.location.pathname);
            this.loadPage(path, true); // Load the initial page
        });

        window.onpopstate = (event) => {
            if (event.state && event.state.path) {
                this.loadPage(event.state.path, false, false); // Don't push state on pop
            }
        };
    }

    setupNavigation() {
        $(document).on("click", ".navbar_link", (e) => {
            e.preventDefault();
            const href = $(e.currentTarget).attr("href");
            const page = this.normalizePath(href);

            if (page === this.normalizePath(window.location.pathname)) {
                return;
            }
            this.loadPage(page);
        });
    }

    loadPage(pagePath, isInitialLoad = false, pushState = true) {
        const pageName = pagePath.substring(1);
        const htmlPath = `/pages/${pageName}.html`;
        const jsPath = `/js/pages/${pageName}.js`;

        this.$mainContent.fadeOut(200, () => {
            if (this.currentPageModule && typeof this.currentPageModule.destroy === "function") {
                this.currentPageModule.destroy();
                this.currentPageModule = null;
            }

            this.$mainContent.load(htmlPath, (response, status) => {
                if (status === "error") {
                    this.$mainContent.html(`<h2>Page Not Found</h2><p>The requested page was not found.</p>`).fadeIn(200);
                    return;
                }

                if (pushState) {
                    const state = { path: pagePath };
                    const title = `${capitalize(pageName)} | Installment System`;
                    window.history.pushState(state, title, pagePath);
                }

                $(".navbar_link").removeClass("navbar_link--active");
                $(`.navbar_link[href="${pagePath}"]`).addClass("navbar_link--active");

                this.loadPageModule(jsPath, pageName);

                this.$mainContent.fadeIn(200);
            });
        });
    }

    async loadPageModule(modulePath, pageName) {
        // Always re-import to ensure we get the module.default, as import() caches results.
        // This simplifies the logic and ensures the moduleClass is always passed.
        try {
            const module = await import(modulePath);
            this.loadedScripts[modulePath] = true;
            this.initPageModule(pageName, module.default);
        } catch (error) {
            console.error(`Could not load module: ${modulePath}`, error);
        }
    }

    initPageModule(pageName, moduleClass) {
        if (moduleClass) {
            this.currentPageModule = new moduleClass();
            this.currentPageModule.init();
        } else {
            // Fallback for already loaded modules (though import() caches)
            // This part might need adjustment based on how modules are truly exposed
            // For now, assuming moduleClass is always passed for new loads
            console.warn(`Module class not provided for ${pageName}. Attempting to re-initialize if already loaded.`);
            // If module was already loaded, it's likely in loadedScripts, but we need its default export
            // This scenario is less likely with dynamic import caching, but good to consider.
        }
    }

    normalizePath(path) {
        if (path === "/" || path === "/index.html") {
            return "/dashboard";
        }
        return path.replace(/\.html$/, "");
    }
}

$(function () {
    const app = new App();
    app.init();
});
