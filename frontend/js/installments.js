// Dummy data for demonstration (will eventually come from a backend API)
const installmentsData = [
    { id: 1, customer: 'John Doe', product: 'Laptop', amount: 1200, dueDate: '2024-07-15', status: 'active' },
    { id: 2, customer: 'Jane Smith', product: 'Smartphone', amount: 800, dueDate: '2024-07-20', status: 'pending' },
    { id: 3, customer: 'Peter Jones', product: 'Smart TV', amount: 1500, dueDate: '2024-07-25', status: 'completed' },
];

function setupInstallmentsPage() {
    // Event listener for adding a new installment
    $('#installment-add-form').on('submit', handleAddInstallment);

    // Event listener for search input
    $('#installment-search').on('input', window.AppUtils.debounce(displayInstallments, 300));

    // Event listener for status filter
    $('#installment-status-filter').on('change', displayInstallments);

    // Initial display of installments
    displayInstallments();
}

function handleAddInstallment(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const installmentData = {
        customer: formData.get('customer'),
        product: formData.get('product'),
        amount: formData.get('amount'),
        dueDate: formData.get('dueDate'),
    };

    // In a real app, you would send this data to your backend API
    console.log('Adding installment:', installmentData);
    // For now, add to dummy data and assign a new ID
    const newId = installmentsData.length > 0 ? Math.max(...installmentsData.map(i => i.id)) + 1 : 1;
    installmentsData.push({ id: newId, ...installmentData, status: 'active' }); // Default status for new installment

    window.AppUtils.showNotification('Installment added successfully!', 'success');
    window.AppUtils.closeModal('installment-add-modal');
    event.target.reset();
    displayInstallments(); // Refresh the list
}

function displayInstallments() {
    const container = $('#installments-list');
    if (!container.length) {
        console.warn("Installments list container not found. Make sure an element with id 'installments-list' exists.");
        return;
    }
    container.empty(); // Clear existing list

    const searchTerm = $('#installment-search').val() ? $('#installment-search').val().toLowerCase() : '';
    const statusFilter = $('#installment-status-filter').val();

    const filteredInstallments = installmentsData.filter(installment => {
        const matchesSearch = installment.customer.toLowerCase().includes(searchTerm) || installment.product.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || installment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filteredInstallments.length === 0) {
        container.append('<p>No installments found matching your criteria.</p>');
        return;
    }

    filteredInstallments.forEach(installment => {
        const statusClass = installment.status === 'active' ? 'badge-success' :
                            installment.status === 'pending' ? 'badge-warning' : 'badge-info';
        const installmentCard = `
            <div class="installment-card">
                <div class="installment-card-info">
                    <h3>Installment #${installment.id}</h3>
                    <p>Customer: ${installment.customer}</p>
                    <p>Product: ${installment.product}</p>
                    <p>Amount: ${installment.amount}</p>
                    <p>Due Date: ${installment.dueDate}</p>
                    <span class="badge ${statusClass}">${installment.status}</span>
                </div>
                <div class="installment-card-actions">
                    <button class="btn btn-sm btn-info" onclick="viewInstallmentDetails(${installment.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="editInstallment(${installment.id})">Edit</button>
                </div>
            </div>
        `;
        container.append(installmentCard);
    });
}

function viewInstallmentDetails(installmentId) {
    console.log('Viewing details for installment:', installmentId);
    window.AppUtils.showNotification(`Viewing details for Installment #${installmentId}`, 'info');
    // In a real app, this would open a modal with more details or navigate to a detail page
    const installment = installmentsData.find(i => i.id === installmentId);
    if (installment) {
        $('#detail-customer').text(installment.customer);
        $('#detail-product').text(installment.product);
        $('#detail-amount').text(`${installment.amount}`);
        $('#detail-dueDate').text(installment.dueDate);
        $('#detail-status').text(installment.status);
        window.AppUtils.openModal('installment-details-modal');
    }
}

function editInstallment(installmentId) {
    console.log('Editing installment:', installmentId);
    window.AppUtils.showNotification(`Editing Installment #${installmentId}`, 'info');
    // In a real app, this would populate the add/edit modal with existing data
    window.AppUtils.openModal('installment-add-modal');
}

function viewAllPlans() {
    console.log('Navigating to view all plans...');
    window.AppUtils.showNotification('Redirecting to all installment plans page (not yet implemented)', 'info');
    // In a real app, you would navigate to a different page or section
}

function resetForm() {
    console.log('Resetting installment plan form...');
    $('#installment-plan-form')[0].reset();
    window.AppUtils.showNotification('Installment plan form has been reset.', 'info');
    // Optionally, reset progress indicator and step to 1
    $('.progress-indicator_step').removeClass('progress-indicator_step-active');
    $('.progress-indicator_step[data-step="1"]').addClass('progress-indicator_step-active');
    $('.form-step').removeClass('form-step-active');
    $('#step-1').addClass('form-step-active');
}

// Initial setup on document ready
$(document).ready(function() {
    setupInstallmentsPage();
});