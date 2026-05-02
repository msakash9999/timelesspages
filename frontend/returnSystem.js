/* returnSystem.js */

const ReturnSystem = {
    init: function() {
        console.log("Return System Initialized");
    },

    /**
     * Opens the return/cancel modal.
     * @param {string} orderId - The ID of the order.
     * @param {string} type - 'return' or 'cancel'.
     */
    openModal: function(orderId, type = 'cancel') {
        const title = type === 'return' ? 'Return Order' : 'Cancel Order';
        const actionLabel = type === 'return' ? 'Process Return' : 'Confirm Cancellation';
        
        const modalHtml = `
            <div class="modal-overlay active" id="returnModal">
                <div class="modal-card">
                    <h2 class="modal-title">${title}</h2>
                    <p style="color:#666; margin-bottom:15px; font-size:14px;">Order ID: <strong>${orderId}</strong></p>
                    
                    <label style="display:block; font-size:12px; color:#999; margin-bottom:8px;">REASON FOR ${type.toUpperCase()}</label>
                    <select id="returnReason" class="reason-select">
                        <option value="">Select a reason...</option>
                        <option value="Wrong Item Ordered">Wrong Item Ordered</option>
                        <option value="Damaged Product">Damaged Product</option>
                        <option value="Delivery Delay">Delivery Delay</option>
                        <option value="Better Alternative Found">Better Alternative Found</option>
                        <option value="Ordered By Mistake">Ordered By Mistake</option>
                    </select>

                    <textarea id="returnComment" placeholder="Additional comments (optional)..." style="width:100%; height:80px; padding:12px; border:1px solid #ddd; border-radius:8px; margin-bottom:20px; font-family:inherit;"></textarea>

                    <div class="modal-actions">
                        <button class="modal-btn secondary" onclick="document.getElementById('returnModal').remove()">Keep Order</button>
                        <button class="modal-btn primary" id="confirmReturnBtn">${actionLabel}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('confirmReturnBtn').onclick = async () => {
            const reason = document.getElementById('returnReason').value;
            if (!reason) {
                alert("Please select a reason.");
                return;
            }

            const btn = document.getElementById('confirmReturnBtn');
            btn.disabled = true;
            btn.textContent = 'Processing...';

            try {
                // Simulate API call
                setTimeout(() => {
                    alert(`Your order ${type === 'return' ? 'return request' : 'cancellation'} has been submitted successfully.`);
                    document.getElementById('returnModal').remove();
                    // Refresh order list if function exists
                    if (window.loadOrders) window.loadOrders();
                }, 1000);
            } catch (error) {
                alert("Error processing request. Please try again.");
                btn.disabled = false;
                btn.textContent = actionLabel;
            }
        };
    }
};

window.ReturnSystem = ReturnSystem;
