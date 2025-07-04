// Customer management specific functionality
setupCustomerManagement()

function setupCustomerManagement() {
    // Setup customer search with advanced filtering
    setupAdvancedSearch()

    // Setup customer card interactions
    setupCustomerCards()

    // Setup customer detail modal
    setupCustomerDetailModal()

    // Add event listener for the form
    $("#add-customer-form").on("submit", handleAddCustomer);
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
        const name = $card.find(".customer-card_name").text().toLowerCase()
        const phone = $card.find(".customer-card_phone").text().toLowerCase()

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
            const nameA = $(a).find(".customer-card_name").text()
            const nameB = $(b).find(".customer-card_name").text()
            return nameA.localeCompare(nameB)

            case "date":
            // In a real app, you'd have actual dates to sort by
            return Math.random() - 0.5 // Random for demo

            case "amount":
            const amountA = Number.parseFloat(
                $(a).find(".customer-card_stat-value").eq(1).text().replace("$", "").replace(",", ""),
            )
            const amountB = Number.parseFloat(
                $(b).find(".customer-card_stat-value").eq(1).text().replace("$", "").replace(",", ""),
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

function viewCustomer(customerId) {
    // In a real app, you would fetch customer data from API
    console.log("Viewing customer:", customerId)
    openModal("customer-detail-modal")
}

function editCustomer(customerId) {
    console.log("Editing customer:", customerId);
    showNotification("Opening edit form...", "info");
}


function sendUrgentReminder(customerId) {
    console.log("Sending urgent reminder to customer:", customerId)
    showNotification("Urgent reminder sent!", "warning");
}

async function handleAddCustomer(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const loadingOverlay = $('#add-customer-modal .loading-overlay');

    try {
        loadingOverlay.show();
        const response = await fetch('/api/customers', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create customer');
        }

        const newCustomer = await response.json();

        // Handle success
        window.AppUtils.closeModal('add-customer-modal');
        window.AppUtils.showNotification('Customer added successfully!', 'success');
        // Optionally, refresh the customer list or add the new customer to the grid
        addCustomerToGrid(newCustomer);
        form.reset();

    } catch (error) {
        console.error('Error adding customer:', error);
        window.AppUtils.showNotification(error.message, 'error');
    } finally {
        loadingOverlay.hide();
    }
}

function addCustomerToGrid(customer) {
    const customerGrid = document.getElementById('customer-grid');
    const newCustomerCard = `
        <div class="customer-card" data-customer-id="${customer.id}">
            <div class="customer-card_header">
                <div class="customer-card_avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-card_info">
                    <h3 class="customer-card_name">${customer.name}</h3>
                    <p class="customer-card_phone">${customer.phone}</p>
                </div>
                <div class="customer-card_status">
                    <span class="badge badge-success">Current</span>
                </div>
            </div>
            <div class="customer-card_details">
                <div class="customer-card_stat">
                    <span class="customer-card_stat-label">Active Plans</span>
                    <span class="customer-card_stat-value">0</span>
                </div>
                <div class="customer-card_stat">
                    <span class="customer-card_stat-label">Total Amount</span>
                    <span class="customer-card_stat-value">$0</span>
                </div>
                <div class="customer-card_stat">
                    <span class="customer-card_stat-label">Overdue</span>
                    <span class="customer-card_stat-value">N/A</span>
                </div>
            </div>
            <div class="customer-card_actions">
                <button class="btn btn-small btn-primary" onclick="viewCustomer(${customer.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-small btn-secondary" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-info" onclick="sendReminder(${customer.id})">
                    <i class="fas fa-bell"></i> Warn
                </button>
            </div>
        </div>
    `;
    customerGrid.insertAdjacentHTML('afterbegin', newCustomerCard);
}