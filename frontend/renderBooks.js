/**
 * renderBooks.js
 * Handles the dynamic rendering of book cards with stock system logic.
 */

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function createBookCard(book) {
    const { id, title, author, category, price, discountPrice, stock, rating, image, description } = book;
    
    // Stock System Logic
    let stockStatus = "";
    let isOutOfStock = false;
    let stockClass = "";

    if (stock === 0) {
        stockStatus = "Out of Stock";
        isOutOfStock = true;
        stockClass = "out-of-stock";
    } else if (stock <= 3) {
        stockStatus = `Only ${stock} Left`;
        stockClass = "urgency";
    } else if (stock <= 5) {
        stockStatus = "Few Items Left";
        stockClass = "warning";
    }

    const ratingStars = "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));

    return `
        <article class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${id}">
            <div class="card-img-wrapper">
                <img src="${image}" alt="${title}" loading="lazy">
                ${stockStatus ? `<div class="premium-stock-badge ${stockClass}">
                    ${stock > 0 ? '<span class="pulse-dot"></span>' : ''}
                    ${stockStatus}
                </div>` : ''}
                ${isOutOfStock ? '<div class="out-of-stock-overlay"><span>Out of Stock</span></div>' : ''}
            </div>
            <div class="card-content">
                <div class="card-category">${category}</div>
                <h3 class="card-title">${title}</h3>
                <p class="card-author">by ${author}</p>
                <div class="card-rating">
                    <span class="stars">${ratingStars}</span>
                    <span class="rating-value">${rating}</span>
                </div>
                <div class="card-price-box">
                    <span class="discount-price">${formatCurrency(discountPrice)}</span>
                    <span class="original-price">${formatCurrency(price)}</span>
                </div>
                <div class="storybook-actions">
                    <button type="button" class="storybook-btn buy-btn" ${isOutOfStock ? 'disabled' : ''} onclick="handleBuyNow('${id}')">Buy Now</button>
                    <button type="button" class="storybook-btn cart-btn" ${isOutOfStock ? 'disabled' : ''} onclick="handleAddToCart('${id}')">Add to Cart</button>
                </div>
            </div>
        </article>
    `;
}

function renderCategoryBooks(books, containerId = "product-grid") {
    const container = document.querySelector(`.${containerId}`) || document.getElementById(containerId);
    if (!container) return;

    if (books.length === 0) {
        container.innerHTML = '<p class="no-books">No books found in this category.</p>';
        return;
    }

    container.innerHTML = books.map(book => createBookCard(book)).join('');
}

// Global handlers for buttons (placeholders for existing logic)
function handleAddToCart(id) {
    const persistence = window.TimelessPagesUserPersistence;
    if (persistence) {
        const book = booksData.find(b => b.id === id);
        if (book) {
            const cartBook = {
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.discountPrice,
                imageUrl: book.image
            };
            persistence.addToCart(cartBook, 1);
            if (typeof showToast === 'function') showToast(`Added ${book.title} to cart`, 'success');
        }
    } else {
        console.log("Add to cart:", id);
    }
}

function handleBuyNow(id) {
    handleAddToCart(id);
    window.location.href = "cart.html";
}
