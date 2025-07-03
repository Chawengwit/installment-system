setupInstallmentsPage();

function setupInstallmentsPage() {
    // Event listener for adding a new installment
    $('#installment-add-form').on('submit', handleAddInstallment);

    // Event listener for search input
    $('#installment-search').on('input', window.AppUtils.debounce(filterInstallments, 300));

    // Event listener for status filter
    $('#installment-status-filter').on('change', filterInstallments);

    // Initial display of installments (can be fetched from an API)
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

    console.log('Adding installment:', installmentData);
    window.AppUtils.showNotification('Installment added successfully!', 'success');
    window.AppUtils.closeModal('installment-add-modal');
    event.target.reset();
    displayInstallments(); // Refresh the list
}

function filterInstallments() {
    const searchTerm = $('#installment-search').val().toLowerCase();
    const statusFilter = $('#installment-status-filter').val();

    $('.installment-card').each(function() {
        const $card = $(this);
        const customerName = $card.find('p:contains("Customer:")').text().toLowerCase();
        const productName = $card.find('p:contains("Product:")').text().toLowerCase();
        const status = $card.find('.badge').text().toLowerCase();

        const matchesSearch = customerName.includes(searchTerm) || productName.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        if (matchesSearch && matchesStatus) {
            $card.show();
        } else {
            $card.hide();
        }
    });
}

function displayInstallments() {
    // This function would typically fetch data from a backend API
    // For now, it just ensures the existing cards are visible after an add/filter
    console.log('Displaying/refreshing installments...');
    filterInstallments(); // Apply filters to initial display
}

function viewInstallmentDetails(installmentId) {
    console.log('Viewing details for installment:', installmentId);
    window.AppUtils.showNotification(`Viewing details for Installment #${installmentId}`, 'info');
    // In a real app, this would open a modal with more details or navigate to a detail page
}

function editInstallment(installmentId) {
    console.log('Editing installment:', installmentId);
    window.AppUtils.showNotification(`Editing Installment #${installmentId}`, 'info');
    // In a real app, this would populate the add/edit modal with existing data
    window.AppUtils.openModal('installment-add-modal');
}