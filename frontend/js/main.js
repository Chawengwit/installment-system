fetch('/api/products')
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('data-container');
        if (data.length === 0) {
            container.innerHTML = '<p>No products found.</p>';
        return;
        }

        container.innerHTML = data.map(product => `
            <div class="product">
                <strong>${product.name}</strong><br/>
                Price: $${product.price}
            </div>
        `).join('');
    })
    .catch(err => {
        console.error(err);
        document.getElementById('data-container').innerText = 'Error loading products.';
});
