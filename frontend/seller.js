(function () {
  var apiUrl = localStorage.getItem('timelessPagesApiBaseUrl') || 'http://localhost:5000';
  var sellerToken = localStorage.getItem('tp_sellerToken');
  var sellerId = localStorage.getItem('tp_sellerId');
  var sellerName = localStorage.getItem('tp_sellerName');
  var sellerStore = localStorage.getItem('tp_sellerStore');

  // Must be logged in
  if (!sellerToken || !sellerId) {
    window.location.href = 'seller-login.html';
    return;
  }

  // Set Nav Info
  var greeting = document.getElementById('sellerGreeting');
  if (greeting) greeting.textContent = 'Welcome, ' + (sellerStore || sellerName);

  document.getElementById('logoutBtn')?.addEventListener('click', async function () {
    try {
      await fetch(apiUrl + '/seller/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Seller logout request failed:', error);
    }
    localStorage.removeItem('tp_sellerToken');
    localStorage.removeItem('tp_sellerId');
    localStorage.removeItem('tp_sellerName');
    localStorage.removeItem('tp_sellerStore');
    localStorage.removeItem('tp_sellerEmail');
    window.location.href = 'seller-login.html';
  });

  /* ── Sidebar/Tab Navigation ── */
  document.querySelectorAll('.tab-btn[data-section]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = this.getAttribute('data-section');
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.seller-section').forEach(function (s) { s.style.display = 'none'; s.classList.remove('active'); });
      var target = document.getElementById('section-' + section);
      if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        if (section === 'seller-insights' && window.SellerInsights) window.SellerInsights.init();
      }
    });
  });

  /* ── DOM Elements ── */
  var bookForm = document.getElementById('sellerBookForm');
  var formMessage = document.getElementById('sellerFormMessage');
  var booksList = document.getElementById('booksList');

  // Helper for requests
  async function requestJson(endpoint, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Authorization = 'Bearer ' + sellerToken;

    var res = await fetch(apiUrl + endpoint, options);
    var text = await res.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { message: text || 'Unknown response' }; }
    return { response: res, data: data };
  }

  function setMsg(msgText, isError) {
    if (!formMessage) return;
    formMessage.textContent = msgText;
    formMessage.className = 'panel-message ' + (isError ? 'error' : 'success');
  }

  function formatPrice(p) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(p || 0));
  }

  window.promptEditStockSeller = async function(bookId, currentStock) {
    var newStock = prompt('Enter new stock quantity:', currentStock);
    if (newStock === null) return;
    newStock = parseInt(newStock, 10);
    if (isNaN(newStock) || newStock < 0) return alert('Invalid stock quantity');
    try {
      var res = await requestJson('/books/' + bookId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock })
      });
      if (!res.response.ok) throw new Error(res.data?.message || 'Failed to update stock');
      loadSellerBooks();
    } catch(e) {
      alert('Error: ' + e.message);
    }
  };

  /* ── My Catalog ── */
  async function loadSellerBooks() {
    if (!booksList) return;
    booksList.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted); text-align:center; padding: 20px;">Loading your catalog...</td></tr>';

    try {
      var res = await requestJson('/books?sellerId=' + sellerId);
      if (!res.response.ok) throw new Error(res.data.message || 'Failed to load books');

      var books = res.data;
      if (books.length === 0) {
        booksList.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted); text-align:center; padding: 20px;">You haven\'t published any books yet.</td></tr>';
        if (document.getElementById('sellerTotalBooks')) document.getElementById('sellerTotalBooks').textContent = 0;
        return;
      }

      var totalStock = 0;
      var totalSold = 0;
      var totalRevenue = 0;
      var lowStockCount = 0;
      var notificationsHtml = '';

      booksList.innerHTML = books.map(function (book) {
        var stock = book.stockQuantity ?? 10;
        var sold = book.soldCount ?? 0;
        var demand = book.demandScore ?? 1;
        var demandBadge = demand > 50 ? '<span style="color:#e74c3c;font-weight:bold;">🔥 High</span>' : 'Normal';

        totalStock += stock;
        totalSold += sold;
        totalRevenue += (sold * book.price);

        if (stock <= 5) {
          lowStockCount++;
          notificationsHtml += '<div style="padding:15px;margin-bottom:10px;background:#fff3cd;border-left:4px solid #f39c12;border-radius:4px;">' +
            '<strong style="color:#f39c12;">Warning: Low Stock</strong><br>' +
            '<span style="color:#555;">' + book.title + ' has only ' + stock + ' units remaining.</span>' +
          '</div>';
        }

        return '<tr style="border-bottom:1px solid #eee;">' +
          '<td style="padding:10px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<img src="' + (book.imageUrl || 'assets/placeholder.png') + '" alt="' + book.title + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">' +
              '<span>' + book.title + '</span>' +
            '</div>' +
          '</td>' +
          '<td style="padding:10px;">' + formatPrice(book.price) + '</td>' +
          '<td style="padding:10px;">' + stock + '</td>' +
          '<td style="padding:10px;">' + sold + '</td>' +
          '<td style="padding:10px;">' + demandBadge + '</td>' +
          '<td style="padding:10px;">' +
            '<button class="btn-sm" style="background:#f39c12;color:#fff;margin-right:5px;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;" onclick="promptEditStockSeller(\'' + book._id + '\', ' + stock + ')">Edit</button>' +
            '<button class="btn-sm btn-danger" style="background:#e74c3c;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;" data-delete="' + book._id + '">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      // Update Stats
      if (document.getElementById('sellerTotalBooks')) document.getElementById('sellerTotalBooks').textContent = books.length;
      if (document.getElementById('sellerTotalSold')) document.getElementById('sellerTotalSold').textContent = totalSold;
      if (document.getElementById('sellerRevenue')) document.getElementById('sellerRevenue').textContent = formatPrice(totalRevenue);
      if (document.getElementById('sellerLowStock')) document.getElementById('sellerLowStock').textContent = lowStockCount;
      if (document.getElementById('sellerNotifications')) {
        document.getElementById('sellerNotifications').innerHTML = notificationsHtml || '<p style="color:#777;">No new alerts.</p>';
      }

      // Bind delete buttons
      booksList.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('Delete this book permanently?')) return;
          var id = this.getAttribute('data-delete');
          this.disabled = true;
          this.textContent = '...';
          try {
            var del = await requestJson('/books/' + id, { method: 'DELETE' });
            if (!del.response.ok) throw new Error(del.data.message || 'Delete failed');
            loadSellerBooks();
          } catch (e) {
            alert('Could not delete: ' + e.message);
            this.textContent = 'Delete';
            this.disabled = false;
          }
        });
      });

    } catch (err) {
      booksList.innerHTML = '<tr><td colspan="6" style="color:var(--danger); text-align:center; padding: 20px;">Error: ' + err.message + '</td></tr>';
    }
  }

  /* ── Submit Book ── */
  if (bookForm) {
    bookForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var imageFile = document.getElementById('bookImageFile')?.files[0];
      var imageUrl = (document.getElementById('bookImageUrl')?.value || '').trim();
      var bookTitle = (document.getElementById('bookTitle')?.value || '').trim();

      if (!imageFile && !imageUrl) {
        setMsg('Please choose an image file or enter an image URL.', true);
        return;
      }

      try {
        var finalImageUrl = imageUrl;

        // Step 1: upload image file to Cloudinary
        if (imageFile) {
          setMsg('Uploading cover image...');
          var fd = new FormData();
          fd.append('image', imageFile);
          var upRes = await fetch(apiUrl + '/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + sellerToken },
            body: fd
          });
          var upData = await upRes.json();
          if (!upRes.ok) throw new Error(upData.message || 'Upload failed');
          finalImageUrl = upData.imageUrl;
        }

        // Step 2: save book
        setMsg('Publishing book...');
        var payload = {
          title: bookTitle,
          author: document.getElementById('bookAuthor')?.value || '',
          price: Number(document.getElementById('bookPrice')?.value || 0),
          stockQuantity: Number(document.getElementById('bookStock')?.value || 0),
          category: document.getElementById('bookCategory')?.value || '',
          imageUrl: finalImageUrl,
          description: document.getElementById('bookDescription')?.value || '',
          sellerId: sellerId
        };

        var saveRes = await requestJson('/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!saveRes.response.ok) throw new Error(saveRes.data.message || 'Failed to publish');

        setMsg('Book published successfully!');
        bookForm.reset();
        document.getElementById('bookImageUrl').value = '';
        loadSellerBooks();

      } catch (err) {
        setMsg(err.message || 'Publishing failed.', true);
      }
    });
  }

  // Init
  loadSellerBooks();

})();
