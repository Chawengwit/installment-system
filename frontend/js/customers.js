async function fetchCustomers(search = '', sortBy = 'created_at', sortOrder = 'DESC') {
    const loadingOverlay = $('#customer-grid .loading-overlay');
    try {
        loadingOverlay.show();
        const response = await fetch(`/api/customers?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
        if (!response.ok) {
            throw new Error('Failed to fetch customers');
        }
        const customers = await response.json();
        renderCustomers(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        window.AppUtils.showNotification(error.message, 'error');
    } finally {
        loadingOverlay.hide();
    }
}

function renderCustomers(customers) {
    const customerGrid = document.getElementById('customer-grid');
    customerGrid.innerHTML = ''; // Clear existing customers

    if (customers.length === 0) {
        customerGrid.innerHTML = '<p>No customers found.</p>';
        return;
    }

    customers.forEach(customer => {
        const customerCard = `
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
                    <button class="btn btn-small btn-danger" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        customerGrid.insertAdjacentHTML('beforeend', customerCard);
    });
}

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

    // Initial fetch of customers
    fetchCustomers();
}

function setupAdvancedSearch() {
    // Search input with debouncing
    $("#customer-search").on(
            "input",
            window.AppUtils.debounce(function () {
        const searchTerm = $('#customer-search').val().toLowerCase()
        const sortBy = $(".filters_select").eq(0).val();
        const sortOrder = $(".filters_select").eq(1).val();
        fetchCustomers(searchTerm, sortBy, sortOrder);
        }, 300),
    )

    // Filter dropdowns
    $(".filters_select").on("change", () => {
        const searchTerm = $("#customer-search").val().toLowerCase();
        const sortBy = $(".filters_select").eq(0).val();
        const sortOrder = $(".filters_select").eq(1).val();
        fetchCustomers(searchTerm, sortBy, sortOrder);
    })
}

function setupCustomerCards() {
    // Add hover effects and click handlers
    $(document).on("click", ".customer-card", function (e) {
        // Don't trigger if clicking on buttons
        if (!$(e.target).closest("button").length) {
            const customerId = $(this).data("customer-id") || 1
            console.log("Viewing customer:", customerId)
            window.AppUtils.openModal("customer-detail-modal")
        }
    })

    // Add keyboard navigation
    $(document).on("keydown", ".customer-card", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            const customerId = $(this).data("customer-id") || 1
            console.log("Viewing customer:", customerId)
            window.AppUtils.openModal("customer-detail-modal")
        }
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

async function editCustomer(customerId) {
    try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch customer data');
        }
        const customer = await response.json();

        const form = document.getElementById('edit-customer-form');
        form.elements['id'].value = customer.id;
        form.elements['name'].value = customer.name;
        form.elements['phone'].value = customer.phone;
        form.elements['address'].value = customer.address;

        const preview = form.querySelector('.id-card-preview');
        if (customer.id_card_image) {
            preview.src = customer.id_card_image;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }

        window.AppUtils.openModal('edit-customer-modal');
    } catch (error) {
        console.error('Error fetching customer for edit:', error);
        window.AppUtils.showNotification(error.message, 'error');
    }
}

async function handleUpdateCustomer(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const customerId = formData.get('id');
    const loadingOverlay = $('#edit-customer-modal .loading-overlay');

    try {
        loadingOverlay.show();
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'PUT',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update customer');
        }

        const updatedCustomer = await response.json();

        // Update the customer card in the UI
        const customerCard = document.querySelector(`.customer-card[data-customer-id="${customerId}"]`);
        if (customerCard) {
            customerCard.querySelector('.customer-card_name').textContent = updatedCustomer.name;
            customerCard.querySelector('.customer-card_phone').textContent = updatedCustomer.phone;
        }

        window.AppUtils.closeModal('edit-customer-modal');
        window.AppUtils.showNotification('Customer updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating customer:', error);
        window.AppUtils.showNotification(error.message, 'error');
    } finally {
        loadingOverlay.hide();
    }
}

// Add event listener for the edit form
document.getElementById('edit-customer-form').addEventListener('submit', handleUpdateCustomer);

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }

    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete customer');
        }

        // Remove the customer card from the UI
        const customerCard = document.querySelector(`.customer-card[data-customer-id="${customerId}"]`);
        if (customerCard) {
            customerCard.remove();
        }

        window.AppUtils.showNotification('Customer deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting customer:', error);
        window.AppUtils.showNotification(error.message, 'error');
    }
}


function sendUrgentReminder(customerId) {
    console.log("Sending urgent reminder to customer:", customerId)
    showNotification("Urgent reminder sent!", "warning");
}

function toggleFilters() {
    $("#filters-panel").slideToggle(200);
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