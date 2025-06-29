$(document).ready(function () {
    $('#nav-container').load('/nav.html', function(response, status, xhr) {
        if (status === 'error') {
            console.error('Failed to load nav.html:', xhr.status, xhr.statusText);
        }
    });
});