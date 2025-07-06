$(function() {
    // Load the navigation bar
    $("#nav-container").load("/nav.html", function() {
        // Set the active link on initial load
        const initialPath = window.location.pathname;
        const initialPage = (initialPath === "/" || initialPath === "/index.html") ? "/dashboard" : initialPath;
        $(`.navbar_link[href="${initialPage}"]`).addClass("navbar_link--active");

        // Add click handler for navigation links
        $(".navbar_link").on("click", function(e) {
            e.preventDefault();
            const page = $(this).attr("href");
            // Prevent reloading the same page
            if (page === window.location.pathname) {
                return;
            }
            loadPage(page);
        });

        // Add click handler for the navbar toggle
        $("#navbar-toggle").on("click", function() {
            $("#navbar-menu").toggleClass("active");
        });
    });

    // Function to load page content with a fade transition
    function loadPage(page, isInitialLoad = false) {
        const $mainContent = $("#main-content");

        const action = () => {
            // Use replaceState for initial load to avoid a blank entry in history
            if (isInitialLoad) {
                window.history.replaceState({ path: page }, '', page);
            } else {
                window.history.pushState({ path: page }, '', page);
            }

            // Load the page content
            $mainContent.load(`/pages${page}.html`, function(response, status, xhr) {
                if (status == "error") {
                    $mainContent.html('<h2>Page Not Found</h2><p>Sorry, the page you are looking for does not exist.</p>');
                } else if (page === "/customers") {
                    if (!window.customersScriptLoaded) {
                        $.getScript('/js/customers.js', function() {
                            window.customersScriptLoaded = true;
                            if (typeof window.initCustomersPage === 'function') {
                                window.initCustomersPage();
                            }
                        });
                    } else {
                        if (typeof window.initCustomersPage === 'function') {
                            window.initCustomersPage();
                        }
                    }
                }
                // Update the active link in the navigation
                $(".navbar_link").removeClass("navbar_link--active");
                $(`.navbar_link[href="${page}"]`).addClass("navbar_link--active");

                // Fade in the new content
                $mainContent.fadeIn(200);
            });
        };

        if (isInitialLoad) {
            // For the first load, just load and fade in
            $mainContent.hide();
            action();
        } else {
            // For subsequent loads, fade out first
            $mainContent.fadeOut(200, action);
        }
    }

    // Handle back/forward button clicks
    window.onpopstate = function(event) {
        if (event.state && event.state.path) {
            loadPage(event.state.path);
        }
    };

    // Load the initial page
    const initialPath = window.location.pathname;
    const pageToLoad = (initialPath === "/" || initialPath === "/index.html") ? "/dashboard" : initialPath;
    loadPage(pageToLoad, true);
});
