

// Customer management specific functionality
setupCustomerManagement()

function setupCustomerManagement() {
    // Setup customer search with advanced filtering
    setupAdvancedSearch()

    // Setup customer card interactions
    setupCustomerCards()

    // Setup customer detail modal
    setupCustomerDetailModal()
}

function setupAdvancedSearch() {
    // Search input with debouncing
    $("#customer-search").on(
            "input",
            window.AppUtils.debounce(function () {
        const searchTerm = $(this).val().toLowerCase()
        filterCustomers(searchTerm)
        }, 300),
    )

    // Filter dropdowns
    $(".filters__select").on("change", () => {
        applyFilters()
    })
}

function setupCustomerCards() {
    // Add hover effects and click handlers
    $(".customer-card").each(function () {
        const $card = $(this)

        // Add click to view functionality
        $card.on("click", (e) => {
        // Don't trigger if clicking on buttons
        if (!$(e.target).closest("button").length) {
            const customerId = $card.data("customer-id") || 1
            console.log("Viewing customer:", customerId)
            window.AppUtils.openModal("customer-detail-modal")
        }
        })

        // Add keyboard navigation
        $card.attr("tabindex", "0").on("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            const customerId = $card.data("customer-id") || 1
            console.log("Viewing customer:", customerId)
            window.AppUtils.openModal("customer-detail-modal")
        }
        })
    })
}

function setupCustomerDetailModal() {
    // Setup payment history interactions
    $(".table tbody tr").on("click", function () {
        const planId = $(this).data("plan-id")
        if (planId) {
        viewInstallmentPlan(planId)
        }
    })
}

function filterCustomers(searchTerm) {
    let visibleCount = 0

    $(".customer-card").each(function () {
        const $card = $(this)
        const name = $card.find(".customer-card__name").text().toLowerCase()
        const phone = $card.find(".customer-card__phone").text().toLowerCase()

        const matches = name.includes(searchTerm) || phone.includes(searchTerm)

        if (matches) {
        $card.show()
        visibleCount++
        } else {
        $card.hide()
        }
    })

    // Show no results message if needed
    updateSearchResults(visibleCount)
}

function applyFilters() {
    const statusFilter = $(".filters__select").eq(0).val()
    const sortBy = $(".filters__select").eq(1).val()

    const $cards = $(".customer-card")

    // Apply status filter
    if (statusFilter) {
        $cards.each(function () {
        const $card = $(this)
        const status = $card.find(".badge").text().toLowerCase()

        if (statusFilter === "current" && status !== "current") {
            $card.hide()
        } else if (statusFilter === "overdue" && status !== "overdue") {
            $card.hide()
        } else if (statusFilter === "completed" && status !== "completed") {
            $card.hide()
        } else {
            $card.show()
        }
        })
    }

    // Apply sorting
    if (sortBy) {
        const $container = $(".customer-grid")
        const $visibleCards = $cards.filter(":visible")

        $visibleCards.sort((a, b) => {
        switch (sortBy) {
            case "name":
            const nameA = $(a).find(".customer-card__name").text()
            const nameB = $(b).find(".customer-card__name").text()
            return nameA.localeCompare(nameB)

            case "date":
            // In a real app, you'd have actual dates to sort by
            return Math.random() - 0.5 // Random for demo

            case "amount":
            const amountA = Number.parseFloat(
                $(a).find(".customer-card__stat-value").eq(1).text().replace("$", "").replace(",", ""),
            )
            const amountB = Number.parseFloat(
                $(b).find(".customer-card__stat-value").eq(1).text().replace("$", "").replace(",", ""),
            )
            return amountB - amountA

            default:
            return 0
        }
        })

        $container.append($visibleCards)
    }
}

function updateSearchResults(count) {
    // Remove existing no results message
    $(".no-results").remove()

    if (count === 0) {
        const noResultsHtml = `
                <div class="no-results">
                    <div class="no-results__content">
                        <i class="fas fa-search no-results__icon"></i>
                        <h3 class="no-results__title">No customers found</h3>
                        <p class="no-results__text">Try adjusting your search terms or filters</p>
                    </div>
                </div>
            `
        $(".customer-grid").after(noResultsHtml)
    }
}

function sendReminder(customerId, type = "email") {
    // Show loading state
    const $btn = $(event.target)
    const originalHtml = $btn.html()
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i>')

    // Simulate API call
    setTimeout(() => {
        window.AppUtils.showNotification(`Reminder sent successfully via ${type}!`, "success")
        $btn.prop("disabled", false).html(originalHtml)
    }, 1500)
}

function viewInstallmentPlan(planId) {
    // In a real app, this would open a detailed view of the installment plan
    console.log("Viewing installment plan:", planId)
    window.AppUtils.showNotification("Opening installment plan details...", "info")
}

function exportCustomerData(format = "excel") {
    // Show loading notification
    window.AppUtils.showNotification(`Exporting customer data as ${format.toUpperCase()}...`, "info")

    // Simulate export process
    setTimeout(() => {
        showNotification(`Customer data exported successfully!`, "success")

        // In a real app, you would trigger the actual download here
        console.log(`Exporting customers as ${format}`)
    }, 2000)
}


