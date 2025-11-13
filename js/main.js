
document.addEventListener('DOMContentLoaded', () => {
  // Handle recent items list
  const list = document.getElementById('items-list');
  if (list) {
    displayRecentItems(list);
  }

  // Handle big action buttons
  setupActionButtons();
});

function displayRecentItems(list) {
  const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
  const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');

  const recent = [...lostItems, ...foundItems]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  if (recent.length === 0) {
    list.innerHTML = '<p class="no-items">No items reported yet.</p>';
  } else {
    list.innerHTML = recent.map(item => `
      <div class="item-card ${item.type}-item">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p><strong>Contact:</strong> ${item.contact}</p>
        <p><small>${new Date(item.date).toLocaleString()}</small></p>
      </div>
    `).join('');
  }
}

function setupActionButtons() {
  const actionButtons = document.querySelectorAll('.big-button');
  actionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.type; // 'lost' or 'found'
      handleNavigation(type);
    });
  });
}

function handleNavigation(type) {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginPrompt();
    return;
  }
  window.location.href = `${type}.html`;
}

function showLoginPrompt() {
  const prompt = document.createElement('div');
  prompt.className = 'login-prompt';
  prompt.innerHTML = `
    <div class="prompt-content">
      <h3>Login Required</h3>
      <p>You must be logged in to report an item.</p>
      <div class="prompt-buttons">
        <button onclick="window.location.href='login.html'" class="btn primary">Login</button>
        <button onclick="closeLoginPrompt()" class="btn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(prompt);
}

function closeLoginPrompt() {
  const prompt = document.querySelector('.login-prompt');
  if (prompt) {
    prompt.remove();
  }
}
