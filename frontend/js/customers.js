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
    const customerTableBody = document.getElementById('customer-table-body');
    customerGrid.innerHTML = ''; // Clear existing customers
    customerTableBody.innerHTML = ''; // Clear existing customers

    if (customers.length === 0) {
        customerGrid.innerHTML = '<p>No customers found.</p>';
        customerTableBody.innerHTML = '<tr><td colspan="5">No customers found.</td></tr>';
        return;
    }

    customers.forEach(customer => {
        // Render card view
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

        // Render table view
        const customerTableRow = `
            <tr data-customer-id="${customer.id}">
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>0</td>
                <td>$0</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="viewCustomer(${customer.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        customerTableBody.insertAdjacentHTML('beforeend', customerTableRow);
    });
}

let isCardView = true; // Default view

function toggleView() {
    isCardView = !isCardView;
    const customerGrid = document.getElementById('customer-grid');
    const customerTableView = document.getElementById('customer-table-view');
    const toggleViewBtn = document.getElementById('toggle-view-btn');

    if (isCardView) {
        customerGrid.style.display = 'grid';
        customerTableView.style.display = 'none';
        toggleViewBtn.innerHTML = '<i class="fas fa-table"></i> Table View';
    } else {
        customerGrid.style.display = 'none';
        customerTableView.style.display = 'block';
        toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i> Card View';
    }
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

    // Add event listener for the toggle view button
    $("#toggle-view-btn").on("click", toggleView);

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
        const placeholder = form.querySelector('.image-preview-placeholder');

        if (customer.id_card_image) {
            preview.src = customer.id_card_image;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            preview.style.display = 'none';
            placeholder.style.display = 'block';
        }

        // Handle image preview for new uploads
        const fileInput = form.querySelector('#edit-idCard-input');
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        };

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
        // Refresh the customer list to show the updated customer in both views
        fetchCustomers();
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

        window.AppUtils.showNotification('Customer deleted successfully!', 'success');
        fetchCustomers();
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

function resetFilters() {
    $("#customer-search").val('');
    $(".filters_select").eq(0).val('created_at'); // Reset Sort By to 'Create Date'
    $(".filters_select").eq(1).val('DESC'); // Reset Order to 'Descending'
    fetchCustomers(); // Re-fetch customers with default filters
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
        // Refresh the customer list to show the new customer in both views
        fetchCustomers();
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