import { debounce, openModal, closeModal, showNotification, showConfirmationModal } from '../utils/AppUtils.js';

class PageCustomers {
    constructor() {
        this.isCardView = true;
        this.$mainContent = $("#main-content");
    }

    init() {
        this.fetchCustomers();
        this.bindEvents();
        console.log("Customers page initialized");
    }

    destroy() {
        this.$mainContent.off();
        console.log("Customers page destroyed");
    }

    bindEvents() {
        this.$mainContent.on("input", "#customer-search", debounce(this.handleSearch.bind(this), 300));
        this.$mainContent.on("change", ".filters_select", this.handleSearch.bind(this));
        this.$mainContent.on("click", "#toggle-view-btn", this.toggleView.bind(this));
        this.$mainContent.on("click", ".customer-card", this.handleViewCustomer.bind(this));
        this.$mainContent.on("click", ".btn-view-customer", this.handleViewCustomer.bind(this));
        this.$mainContent.on("submit", "#add-customer-form", this.handleAddCustomer.bind(this));
        this.$mainContent.on("submit", "#edit-customer-form", this.handleUpdateCustomer.bind(this));
        this.$mainContent.on("click", ".btn-delete-customer", this.handleDeleteCustomer.bind(this));
        this.$mainContent.on("click", ".btn-edit-customer", this.handleEditCustomer.bind(this));
        this.$mainContent.on("click", ".search-bar_filter-btn", this.toggleFilters.bind(this));
        this.$mainContent.on("click", ".reset-filters-btn", this.resetFilters.bind(this));
    }

    toggleFilters() {
        $("#filters-panel").slideToggle(200);
    }

    resetFilters() {
        $("#customer-search").val('');
        $(".filters_select").eq(0).val('created_at');
        $(".filters_select").eq(1).val('DESC');
        this.fetchCustomers();
    }

    handleSearch() {
        const searchTerm = $('#customer-search').val().toLowerCase();
        const sortBy = $(".filters_select").eq(0).val();
        const sortOrder = $(".filters_select").eq(1).val();
        this.fetchCustomers(searchTerm, sortBy, sortOrder);
    }

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
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.hide();
        }
    }

    renderCustomers(customers) {
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
    }

    createCustomerCard(customer) {
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
    }

    createCustomerTableRow(customer) {
        return `
            <tr data-customer-id="${customer.id}">
                <td data-label="Name">${customer.name}</td>
                <td data-label="Phone">${customer.phone}</td>
                <td data-label="Active Plans">0</td>
                <td data-label="Total Amount">$0</td>
                <td data-label="Actions">
                    <button class="btn btn-small btn-primary btn-view-customer"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-small btn-secondary btn-edit-customer"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-danger btn-delete-customer"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    toggleView() {
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
    }

    handleViewCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        console.log("Viewing customer:", customerId);
        openModal("customer-detail-modal");
    }

    async handleAddCustomer(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const loadingOverlay = $('#add-customer-modal .loading-overlay');

        try {
            loadingOverlay.show();
            const response = await fetch('/api/customers', { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to create customer');
            closeModal('add-customer-modal');
            showNotification('Customer added successfully!', 'success');
            this.fetchCustomers();
            form.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.hide();
        }
    }

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
            closeModal('edit-customer-modal');
            showNotification('Customer updated successfully!', 'success');
            this.fetchCustomers();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.hide();
        }
    }

    handleDeleteCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        showConfirmationModal('Are you sure you want to delete this customer?', async () => {
            try {
                const response = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete customer');
                showNotification('Customer deleted successfully!', 'success');
                this.fetchCustomers();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    async handleEditCustomer(e) {
        e.stopPropagation();
        const customerId = $(e.currentTarget).closest("[data-customer-id]").data("customer-id");
        try {
            const response = await fetch(`/api/customers/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch customer data');
            const customer = await response.json();

            const form = $('#edit-customer-form');
            form.find('[name="id"]').val(customer.id);
            form.find('[name="name"]').val(customer.name);
            form.find('[name="phone"]').val(customer.phone);
            form.find('[name="address"]').val(customer.address);

            const preview = form.find('.id-card-preview');
            const placeholder = form.find('.image-preview-placeholder');

            if (customer.id_card_image) {
                preview.attr('src', customer.id_card_image).show();
                placeholder.hide();
            } else {
                preview.hide();
                placeholder.show();
            }

            const fileInput = form.find('#edit-idCard-input');
            fileInput.off('change').on('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.attr('src', e.target.result).show();
                        placeholder.hide();
                    };
                    reader.readAsDataURL(file);
                }
            });

            openModal('edit-customer-modal');
        } catch (error) {
            console.error('Error fetching customer for edit:', error);
            showNotification(error.message, 'error');
        }
    }
}

export default PageCustomers;
