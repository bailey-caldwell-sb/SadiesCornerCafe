// Order Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
    const deliverySection = document.getElementById('deliveryAddress');
    const menuItems = document.querySelectorAll('input[name="menuItems"]');
    const addonItems = document.querySelectorAll('input[name*="-addons"]');
    const submitBtn = document.querySelector('.submit-btn');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    const TAX_RATE = 0.085; // 8.5% tax rate for South Carolina

    // Handle order type change (pickup vs delivery)
    orderTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'delivery') {
                deliverySection.style.display = 'block';
                // Make delivery fields required
                document.getElementById('address').required = true;
                document.getElementById('city').required = true;
                document.getElementById('zipcode').required = true;
            } else {
                deliverySection.style.display = 'none';
                // Remove required from delivery fields
                document.getElementById('address').required = false;
                document.getElementById('city').required = false;
                document.getElementById('zipcode').required = false;
            }
        });
    });

    // Handle menu item selection visual feedback and calculations
    menuItems.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const menuItem = this.closest('.menu-item');
            if (this.checked) {
                menuItem.classList.add('selected');
            } else {
                menuItem.classList.remove('selected');
                // Uncheck all addon items for this menu item
                const addonCheckboxes = menuItem.querySelectorAll('input[name*="-addons"]');
                addonCheckboxes.forEach(addon => {
                    addon.checked = false;
                });
            }
            updateOrderSummary();
        });
    });
    
    // Handle addon item selection
    addonItems.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateOrderSummary();
        });
    });
    
    // Update order summary with calculations
    function updateOrderSummary() {
        let subtotal = 0;
        
        // Calculate subtotal from selected menu items
        menuItems.forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseFloat(checkbox.dataset.price || 0);
                subtotal += price;
                
                // Add addon prices for this item
                const menuItem = checkbox.closest('.menu-item');
                const addonCheckboxes = menuItem.querySelectorAll('input[name*="-addons"]:checked');
                addonCheckboxes.forEach(addon => {
                    const addonPrice = parseFloat(addon.dataset.price || 0);
                    subtotal += addonPrice;
                });
            }
        });
        
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        
        // Update display
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        taxEl.textContent = `$${tax.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // Handle form submission
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if at least one menu item is selected
        const selectedItems = Array.from(menuItems).filter(item => item.checked);
        if (selectedItems.length === 0) {
            showMessage('Please select at least one menu item.', 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Collect form data
        const formData = new FormData(orderForm);
        const selectedItemsWithAddons = [];
        
        // Build detailed order items with addons
        selectedItems.forEach(item => {
            const menuItem = item.closest('.menu-item');
            const itemName = item.value;
            const itemPrice = parseFloat(item.dataset.price || 0);
            let totalItemPrice = itemPrice;
            let itemDescription = itemName;
            
            // Check for addons
            const addonCheckboxes = menuItem.querySelectorAll('input[name*="-addons"]:checked');
            const addons = [];
            addonCheckboxes.forEach(addon => {
                const addonPrice = parseFloat(addon.dataset.price || 0);
                addons.push(`${addon.value} (+$${addonPrice.toFixed(2)})`);
                totalItemPrice += addonPrice;
            });
            
            if (addons.length > 0) {
                itemDescription += ` with ${addons.join(', ')}`;
            }
            
            selectedItemsWithAddons.push({
                name: itemName,
                description: itemDescription,
                price: totalItemPrice
            });
        });
        
        const orderData = {
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail'),
            orderType: formData.get('orderType'),
            address: formData.get('address') || '',
            city: formData.get('city') || '',
            zipcode: formData.get('zipcode') || '',
            menuItems: selectedItemsWithAddons,
            specialInstructions: formData.get('specialInstructions') || ''
        };

        // Send email using EmailJS
        sendOrderEmail(orderData);
    });

    function sendOrderEmail(orderData) {
        // Calculate totals
        const subtotal = orderData.menuItems.reduce((sum, item) => sum + item.price, 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        
        // Format menu items for email
        const formattedItems = orderData.menuItems.map(item => 
            `${item.description} - $${item.price.toFixed(2)}`
        ).join('\n');
        
        // Prepare email content
        const emailContent = {
            to_email: 'bailey.caldwell@gmail.com',
            from_name: orderData.customerName,
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone,
            customer_email: orderData.customerEmail,
            order_type: orderData.orderType,
            delivery_address: orderData.orderType === 'delivery' ? 
                `${orderData.address}, ${orderData.city}, ${orderData.zipcode}` : 'N/A',
            menu_items: formattedItems,
            special_instructions: orderData.specialInstructions || 'None',
            subtotal: `$${subtotal.toFixed(2)}`,
            tax: `$${tax.toFixed(2)}`,
            order_total: `$${total.toFixed(2)}`,
            order_date: new Date().toLocaleDateString(),
            order_time: new Date().toLocaleTimeString()
        };

        // For demo purposes, we'll simulate email sending
        // In production, you'd integrate with EmailJS, Netlify Forms, or a backend service
        setTimeout(() => {
            console.log('Order submitted:', emailContent);
            
            // Show success message
            showMessage('Order submitted successfully! We\'ll contact you soon to confirm details.', 'success');
            
            // Reset form
            orderForm.reset();
            document.querySelectorAll('.menu-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            deliverySection.style.display = 'none';
            
            // Reset button
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Send actual email (this would need a backend service or EmailJS setup)
            sendEmailViaService(emailContent);
            
        }, 2000); // Simulate network delay
    }

    function sendEmailViaService(emailContent) {
        // This is where you'd integrate with an actual email service
        // For now, we'll use a simple mailto link as fallback
        const subject = encodeURIComponent(`New Friends & Family Order from ${emailContent.customer_name}`);
        const body = encodeURIComponent(`
New Order Details:

Customer: ${emailContent.customer_name}
Phone: ${emailContent.customer_phone}
Email: ${emailContent.customer_email}

Order Type: ${emailContent.order_type}
${emailContent.order_type === 'delivery' ? `Delivery Address: ${emailContent.delivery_address}` : ''}

Items Ordered:
${emailContent.menu_items}

Special Instructions: ${emailContent.special_instructions}

Order Summary:
Subtotal: ${emailContent.subtotal}
Tax (8.5%): ${emailContent.tax}
Total: ${emailContent.order_total}

Order Date: ${emailContent.order_date} at ${emailContent.order_time}
        `);
        
        // Create a hidden mailto link and click it
        const mailtoLink = `mailto:bailey.caldwell@gmail.com?subject=${subject}&body=${body}`;
        const tempLink = document.createElement('a');
        tempLink.href = mailtoLink;
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    }

    // Initialize order summary on page load
    updateOrderSummary();

    function showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message show`;
        messageDiv.textContent = message;

        // Insert before submit button
        const submitSection = document.querySelector('.form-section:last-child');
        submitSection.insertBefore(messageDiv, submitBtn);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
});

// EmailJS Integration (if you want to use EmailJS service)
// You would need to include EmailJS library and configure it
/*
function initEmailJS() {
    // Initialize EmailJS with your public key
    emailjs.init("YOUR_PUBLIC_KEY");
}

function sendEmailViaEmailJS(orderData) {
    const templateParams = {
        to_email: 'bailey.caldwell@gmail.com',
        from_name: orderData.customerName,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        order_type: orderData.orderType,
        delivery_address: orderData.orderType === 'delivery' ? 
            `${orderData.address}, ${orderData.city}, ${orderData.zipcode}` : 'N/A',
        menu_items: orderData.menuItems.join('\n'),
        special_instructions: orderData.specialInstructions || 'None',
        order_total: calculateTotal(orderData.menuItems)
    };

    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function(response) {
            console.log('Email sent successfully:', response);
            showMessage('Order submitted successfully! We\'ll contact you soon.', 'success');
        })
        .catch(function(error) {
            console.error('Email failed to send:', error);
            showMessage('There was an error submitting your order. Please try again.', 'error');
        });
}
*/
