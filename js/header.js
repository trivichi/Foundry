function updateAuthHeader() {
  const authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) return;

  const user = JSON.parse(localStorage.getItem('data'));
  

  if (user) {
    authButtons.innerHTML = `
      <span class="user-name">Welcome, ${user.user_name}</span>
      <button onclick="logout()" class="btn">Logout</button>
    `;
  } else {
    authButtons.innerHTML = `
      <a href="login.html" class="btn">Login</a>
      <a href="signup.html" class="btn primary">Signup</a>
    `;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('data'); // Changed from 'user' to 'data'
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', updateAuthHeader);