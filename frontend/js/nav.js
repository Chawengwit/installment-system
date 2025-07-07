$(function() {
    const $mainContent = $("#main-content");
    const loadedScripts = {}; // Track which scripts have been loaded

    // Load the navigation bar
    $("#nav-container").load("/nav.html", function() {
        setupNavigation();

        const path = normalizePath(window.location.pathname);
        loadPage(path, true);
    });

    function setupNavigation() {
        $(document).on("click", ".navbar_link", function (e) {
            e.preventDefault();
            const href = $(this).attr("href");
            const page = normalizePath(href);

            if (page === normalizePath(window.location.pathname)) return;
            loadPage(page);
        });
    }

    // Function to load page content with a fade transition
    function loadPage(pagePath, isInitialLoad = false) {
        const pageName = pagePath.replace("/", "");
        const htmlPath = `/pages/${pageName}.html`;
        const jsPath = `/js/${pageName}.js`;
        const initFnName = `init${capitalize(pageName)}Page`;

        const doLoad = () => {
            if (isInitialLoad) {
                window.history.replaceState({ path: pagePath }, "", pagePath);
            } else {
                window.history.pushState({ path: pagePath }, "", pagePath);
            }

            $mainContent.load(htmlPath, function (response, status) {
                if (status === "error") {
                    $mainContent.html(`<h2>Page Not Found</h2><p>${htmlPath} not found.</p>`);
                    return;
                }

                $(".navbar_link").removeClass("navbar_link--active");
                $(`.navbar_link[href="${pagePath}"]`).addClass("navbar_link--active");

                if (!loadedScripts[jsPath]) {
                    $.getScript(jsPath, function () {
                        loadedScripts[jsPath] = true;
                        if (typeof window[initFnName] === "function") {
                            window[initFnName]();
                        }
                    });
                } else {
                    if (typeof window[initFnName] === "function") {
                        window[initFnName]();
                    }
                }

                $mainContent.fadeIn(200);
            });
        };

        $mainContent.fadeOut(200, doLoad);
    }

    // Handle back/forward button clicks
    window.onpopstate = function(event) {
        if (event.state && event.state.path) {
            loadPage(event.state.path);
        }
    };

    function normalizePath(path) {
        return path.replace(/^\/?index\.html$/, "/dashboard").replace(/\.html$/, "");
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
