/* stockBadge.js */

const StockBadge = {
    /**
     * Generates HTML for a premium stock badge based on quantity.
     * @param {number} stock - The stock quantity.
     * @returns {string} - HTML string for the badge.
     */
    getBadgeHTML: function(stock) {
        if (stock > 5) return "";

        let status = "";
        let className = "";
        let showPulse = false;

        if (stock === 0) {
            status = "Out of Stock";
            className = "out-of-stock";
        } else if (stock <= 3) {
            status = `Only ${stock} Left`;
            className = "urgency";
            showPulse = true;
        } else {
            status = "Few Items Left";
            className = "warning";
            showPulse = true;
        }

        return `
            <div class="premium-stock-badge ${className}">
                ${showPulse ? '<span class="pulse-dot"></span>' : ''}
                ${status}
            </div>
        `;
    },

    /**
     * Updates a product card UI based on stock level.
     * @param {HTMLElement} card - The product card element.
     * @param {number} stock - The stock quantity.
     */
    applyToCard: function(card, stock) {
        const isOutOfStock = stock === 0;
        
        // Add out-of-stock class for styling
        if (isOutOfStock) {
            card.classList.add('out-of-stock');
            
            // Add overlay if missing
            if (!card.querySelector('.out-of-stock-overlay')) {
                const imgWrapper = card.querySelector('.card-img-wrapper') || card.querySelector('.arrival-img-wrapper') || card;
                const overlay = document.createElement('div');
                overlay.className = 'out-of-stock-overlay';
                overlay.innerHTML = '<span>Out of Stock</span>';
                imgWrapper.appendChild(overlay);
            }
        } else {
            card.classList.remove('out-of-stock');
            card.querySelector('.out-of-stock-overlay')?.remove();
        }

        // Disable/Enable buttons
        const buttons = card.querySelectorAll('.buy-btn, .cart-btn, .storybook-btn');
        buttons.forEach(btn => {
            btn.disabled = isOutOfStock;
            if (isOutOfStock) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });

        // Add the badge below buttons as requested or in the img wrapper
        const badgeHTML = this.getBadgeHTML(stock);
        if (badgeHTML) {
            // Try to find a place to insert the badge
            // User requested: "Add stock info below Buy Now / Add to Cart buttons"
            let actions = card.querySelector('.storybook-actions') || card.querySelector('.card-content');
            if (actions) {
                // Remove existing badge if any
                card.querySelector('.premium-stock-badge')?.remove();
                actions.insertAdjacentHTML('beforeend', badgeHTML);
            }
        }
    }
};

// Export to window for global access
window.StockBadge = StockBadge;
