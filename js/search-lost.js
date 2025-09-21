document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const userData = JSON.parse(localStorage.getItem('data'));
  console.log(userData.user_email);

  try {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '<p class="loading">Loading found items...</p>';

    const response = await fetch('https://backendofhackapi.onrender.com/found-items', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('Fetched found items:', data);
    // Pass userData as an argument here
    renderFoundItems(searchResults, data.found_items, userData, token);

  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again later.');
  }
});

// Update function signature to accept userData
function renderFoundItems(container, items, userData, token) {
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<p>No found items available.</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
      <img src="${item.image_url}" alt="${item.title}" onerror="this.src='assests/placeholder.png'">
      <div class="card-body">
        <h3>${item.title}</h3>
        <p><strong>Description:</strong> ${item.description}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p class="coordinates"><small>📍 ${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</small></p>
        <button class="btn primary contact-btn" data-finder-email="${item.user_email}">
          Contact Finder
        </button>
        <p class="notification-status" style="display: none;"></p>
      </div>
    `;

    container.appendChild(card);

    // Add click handler for contact button
    const contactBtn = card.querySelector('.contact-btn');
    const notificationStatus = card.querySelector('.notification-status');

    // Update the click handler inside renderFoundItems function
    contactBtn.addEventListener('click', async () => {
      try {
        const formData = new FormData();
        // Remove claimer_email since it's taken from current_user in backend
        formData.append('item_id', item._id);
        formData.append('finder_email', item.user_email);
        console.log(formData.get('item_id'), formData.get('finder_email'));
        const response = await fetch('https://backendofhackapi.onrender.com/notify-finder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          contactBtn.style.display = 'none';
          notificationStatus.style.display = 'block';
          notificationStatus.textContent = '✓ Notified the finder';
          notificationStatus.style.color = 'var(--accent-green)';
        } else {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to notify finder');
        }
      } catch (error) {
        console.error('Error notifying finder:', error);
        notificationStatus.style.display = 'block';
        notificationStatus.textContent = '❌ ' + (error.message || 'Failed to notify finder');
        notificationStatus.style.color = 'var(--error-color)';
      }
    });
  });
}