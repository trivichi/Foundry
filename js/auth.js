document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  // Update header on page load
  updateAuthHeader();

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(signupForm);
      const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
      };

      try {
        console.log('Attempting signup with:', userData);
        const response = await fetch('https://backendofhackapi.onrender.com/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        if (response.ok) {

          window.location.href = 'login.html';
        } else {
          const errorData = await response.json();
          alert(errorData.detail || 'Signup failed');
        }
      } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
      }
    });
  }

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      try {
        console.log('Attempting login with:', loginData);
        const response = await fetch('https://backendofhackapi.onrender.com/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(loginData)
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.access_token);
          
          // Fetch user details from homepage route
          const userResponse = await fetch('https://backendofhackapi.onrender.com/homepage', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User data:', userData);
            localStorage.setItem('data', JSON.stringify(userData));
            // Redirect to index page after successful login and data storage
            window.location.replace('index.html');
          } else {
            throw new Error('Failed to fetch user data');
          }
        } else {
          const errorData = await response.json();
          alert(errorData.detail || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    });
  }

// Update the header function to use the correct user data structure
function updateAuthHeader() {
  const authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) return;

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}});