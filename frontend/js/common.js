// Modal functions
function openModal(modalId) {
    $(`#${modalId}`).addClass("open");
    $("body").css("overflow", "hidden");
}

function closeModal(modalId) {
    $(`#${modalId}`).removeClass("open");
    $("body").css("overflow", "auto");

    // Reset form if it exists
    const form = $(`#${modalId} form`);
    if (form.length) {
        form[0].reset();
    }
}

function showConfirmationModal(message, onConfirm) {
    const confirmationModal = $('#confirmation-modal');
    const confirmationMessage = $('#confirmation-message');
    const confirmActionBtn = $('#confirm-action-btn');

    confirmationMessage.text(message);
    confirmActionBtn.off('click').on('click', () => {
        onConfirm();
        closeModal('confirmation-modal');
    });

    openModal('confirmation-modal');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = $(`
            <div class="notification notification--${type}">
                <div class="notification__content">
                    <i class="fas fa-${getNotificationIcon(type)}"></i>
                    <span>${message}</span>
                </div>
                <button class="notification__close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);

    // Add to page
    if (!$(".notification-container").length) {
        $("body").append('<div class="notification-container"></div>');
    }

    $(".notification-container").append(notification);

    // Show notification
    setTimeout(() => {
        notification.addClass("notification--show");
    }, 100);

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Close button handler
    notification.find(".notification__close").on("click", () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.removeClass("notification--show");
    setTimeout(() => {
        notification.remove();
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: "check-circle",
        warning: "exclamation-triangle",
        error: "times-circle",
        info: "info-circle",
    };
    return icons[type] || icons.info;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
}

// Export functions for use in other scripts
window.AppUtils = {
    openModal,
    closeModal,
    showNotification,
    formatCurrency,
    formatDate,
    debounce,
    showConfirmationModal,
};