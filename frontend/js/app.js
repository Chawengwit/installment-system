(function ($) {
    const App = {
        // Main content container
        $mainContent: $("#main-content"),

        // Cache for loaded scripts and the current page module
        loadedScripts: {},
        currentPageModule: null,

        // Initialize the application
        init: function () {
            // Load navigation and set up event listeners
            $("#nav-container").load("/nav.html", () => {
                this.setupNavigation();
                const path = this.normalizePath(window.location.pathname);
                this.loadPage(path, true); // Load the initial page
            });

            // Handle browser back/forward buttons
            window.onpopstate = (event) => {
                if (event.state && event.state.path) {
                    this.loadPage(event.state.path, false, false); // Don't push state on pop
                }
            };
        },

        // Set up navigation link handlers
        setupNavigation: function () {
            $(document).on("click", ".navbar_link", (e) => {
                e.preventDefault();
                const href = $(e.currentTarget).attr("href");
                const page = this.normalizePath(href);

                // Avoid reloading the same page
                if (page === this.normalizePath(window.location.pathname)) {
                    return;
                }
                this.loadPage(page);
            });
        },

        // Load a page's content and associated script
        loadPage: function (pagePath, isInitialLoad = false, pushState = true) {
            const pageName = pagePath.substring(1); // Remove leading '/'
            const htmlPath = `/pages/${pageName}.html`;
            const jsPath = `/js/pages/${pageName}.js`;

            // Fade out the old content
            this.$mainContent.fadeOut(200, () => {
                // Destroy the previous page's module to clean up event listeners
                if (this.currentPageModule && typeof this.currentPageModule.destroy === "function") {
                    this.currentPageModule.destroy();
                    this.currentPageModule = null;
                }

                // Load the new HTML content
                this.$mainContent.load(htmlPath, (response, status) => {
                    if (status === "error") {
                        this.$mainContent.html(`<h2>Page Not Found</h2><p>The requested page was not found.</p>`).fadeIn(200);
                        return;
                    }

                    // Update the URL and browser history
                    if (pushState) {
                        const state = { path: pagePath };
                        const title = `${this.capitalize(pageName)} | Installment System`;
                        window.history.pushState(state, title, pagePath);
                    }

                    // Update the active link in the navigation
                    $(".navbar_link").removeClass("navbar_link--active");
                    $(`.navbar_link[href="${pagePath}"]`).addClass("navbar_link--active");

                    // Load and initialize the page-specific JavaScript
                    this.loadPageScript(jsPath, pageName);

                    // Fade in the new content
                    this.$mainContent.fadeIn(200);
                });
            });
        },

        // Load and execute the script for a specific page
        loadPageScript: function (scriptPath, pageName) {
            // Check if the script is already loaded
            if (this.loadedScripts[scriptPath]) {
                // If loaded, just re-initialize the page module
                this.initPageModule(pageName);
            } else {
                // If not loaded, fetch it
                $.getScript(scriptPath)
                    .done(() => {
                        this.loadedScripts[scriptPath] = true;
                        this.initPageModule(pageName);
                    })
                    .fail(() => {
                        console.error(`Could not load script: ${scriptPath}`);
                    });
            }
        },

        // Initialize the JavaScript module for the current page
        initPageModule: function (pageName) {
            const moduleName = `Page${this.capitalize(pageName)}`;
            if (window[moduleName] && typeof window[moduleName].init === "function") {
                this.currentPageModule = window[moduleName];
                this.currentPageModule.init();
            }
        },

        // Utility function to normalize URL paths
        normalizePath: function (path) {
            if (path === "/" || path === "/index.html") {
                return "/dashboard";
            }
            return path.replace(/\.html$/, "");
        },

        // Utility function to capitalize strings
        capitalize: function (str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
    };

    // Start the application when the DOM is ready
    $(function () {
        App.init();
    });

})(jQuery);