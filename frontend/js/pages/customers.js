(function ($) {
    // Define the module for the Customers page
    const PageCustomers = {
        isCardView: true,

        // Function to initialize the page
        init: function () {
            this.fetchCustomers();
            this.bindEvents();
            console.log("Customers page initialized");
        },

        // Function to bind event listeners
        bindEvents: function () {
            const $main = $("#main-content");
            $main.on("input", "#customer-search", AppUtils.debounce(this.handleSearch.bind(this), 300));
            $main.on("change", ".filters_select", this.handleSearch.bind(this));
            $main.on("click", "#toggle-view-btn", this.toggleView.bind(this));
            $main.on("click", ".customer-card", this.handleViewCustomer.bind(this));
            $main.on("submit", "#add-customer-form", this.handleAddCustomer.bind(this));
            $main.on("submit", "#edit-customer-form", this.handleUpdateCustomer.bind(this));
            $main.on("click", ".btn-delete-customer", this.handleDeleteCustomer.bind(this));
        },

        handleSearch: function() {
            const searchTerm = $('#customer-search').val().toLowerCase();
            const sortBy = $(".filters_select").eq(0).val();
            const sortOrder = $(".filters_select").eq(1).val();
            this.fetchCustomers(searchTerm, sortBy, sortOrder);
        },

        async fetchCustomers(search = '', sortBy = 'created_at', sortOrder = 'DESC') {
            const loadingOverlay = $('#customer-grid .loading-overlay');
            try {
                loadingOverlay.show();
                const response = await fetch(`/api/customers?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
                if (!response.ok) throw new Error('Failed to fetch customers');
                const customers = await response.json();
                this.renderCustomers(customers);
            } catch (error) {
                console.error('Error fetching customers:', error);
                window.AppUtils.showNotification(error.message, 'error');
            } finally {
                loadingOverlay.hide();
            }
        },

        renderCustomers: function(customers) {
            const customerGrid = $('#customer-grid');
            const customerTableBody = $('#customer-table-body');
            customerGrid.html('');
            customerTableBody.html('');

            if (customers.length === 0) {
                customerGrid.html('<p>No customers found.</p>');
                customerTableBody.html('<tr><td colspan="5">No customers found.</td></tr>');
                return;
            }

            customers.forEach(customer => {
                const customerCard = this.createCustomerCard(customer);
                const customerTableRow = this.createCustomerTableRow(customer);
                customerGrid.append(customerCard);
                customerTableBody.append(customerTableRow);
            });
        },

        createCustomerCard: function(customer) {
            return `
                <div class="customer-card" data-customer-id="${customer.id}">
                    <div class="customer-card_header">
                        <div class="customer-card_avatar"><i class="fas fa-user"></i></div>
                        <div class="customer-card_info">
                            <h3 class="customer-card_name">${customer.name}</h3>
                            <p class="customer-card_phone">${customer.phone}</p>
                        </div>
                    </div>
                    <div class="customer-card_actions">
                        <button class="btn btn-small btn-primary btn-view-customer"><i class="fas fa-eye"></i> View</button>
                        <button class="btn btn-small btn-secondary btn-edit-customer"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-small btn-danger btn-delete-customer"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            `;
        },

        createCustomerTableRow: function(customer) {
            return `
                <tr data-customer-id="${customer.id}">
                    <td data-label="Name">${customer.name}</td>
                    <td data-label="Phone">${customer.phone}</td>
                    <td data-label="Actions">
                        <button class="btn btn-small btn-primary btn-view-customer"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-small btn-secondary btn-edit-customer"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-small btn-danger btn-delete-customer"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        },

        toggleView: function() {
            this.isCardView = !this.isCardView;
            const customerGrid = $('#customer-grid');
            const customerTableView = $('#customer-table-view');
            const toggleViewBtn = $('#toggle-view-btn');

            if (this.isCardView) {
                customerGrid.show();
                customerTableView.hide();
                toggleViewBtn.html('<i class="fas fa-table"></i> Table View');
            } else {
                customerGrid.hide();
                customerTableView.show();
                toggleViewBtn.html('<i class="fas fa-th-large"></i> Card View');
            }
        },

        handleViewCustomer: function(e) {
            const customerId = $(e.currentTarget).data("customer-id");
            console.log("Viewing customer:", customerId);
            window.AppUtils.openModal("customer-detail-modal");
        },

        async handleAddCustomer(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const loadingOverlay = $('#add-customer-modal .loading-overlay');

            try {
                loadingOverlay.show();
                const response = await fetch('/api/customers', { method: 'POST', body: formData });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to create customer');
                window.AppUtils.closeModal('add-customer-modal');
                window.AppUtils.showNotification('Customer added successfully!', 'success');
                this.fetchCustomers();
                form.reset();
            } catch (error) {
                window.AppUtils.showNotification(error.message, 'error');
            } finally {
                loadingOverlay.hide();
            }
        },

        async handleUpdateCustomer(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const customerId = formData.get('id');
            const loadingOverlay = $('#edit-customer-modal .loading-overlay');

            try {
                loadingOverlay.show();
                const response = await fetch(`/api/customers/${customerId}`, { method: 'PUT', body: formData });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to update customer');
                window.AppUtils.closeModal('edit-customer-modal');
                window.AppUtils.showNotification('Customer updated successfully!', 'success');
                this.fetchCustomers();
            } catch (error) {
                window.AppUtils.showNotification(error.message, 'error');
            } finally {
                loadingOverlay.hide();
            }
        },

        handleDeleteCustomer: function(e) {
            const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
            window.AppUtils.showConfirmationModal('Are you sure you want to delete this customer?', async () => {
                try {
                    const response = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete customer');
                    window.AppUtils.showNotification('Customer deleted successfully!', 'success');
                    this.fetchCustomers();
                } catch (error) {
                    window.AppUtils.showNotification(error.message, 'error');
                }
            });
        },

        // Function to clean up event listeners
        destroy: function () {
            $("#main-content").off();
            console.log("Customers page destroyed");
        },
    };

    // Expose the module to the global scope
    window.PageCustomers = PageCustomers;

})(jQuery);