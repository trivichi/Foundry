// Foundry Lost and Found JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const foundForm = document.getElementById('foundForm');
  const foundList = document.getElementById('found-items-list');
  const locationInput = document.getElementById('location-input');
  const useCurrentLocationBtn = document.getElementById('use-current-location');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const coordinatesText = document.getElementById('coordinates-text');
  const imageInput = document.getElementById('image-input');
  const imagePreview = document.getElementById('image-preview');

  // Load data
  const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');

  // Initialize map
  let map = null;
  let marker = null;

  if (document.getElementById('location-map')) {
    map = L.map('location-map').setView([13.0827, 80.2707], 13); // Default to Chennai
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add click handler to map
    map.on('click', (e) => {
      updateLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  // Handle current location button
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        useCurrentLocationBtn.disabled = true;
        useCurrentLocationBtn.textContent = 'Getting location...';
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude);
            useCurrentLocationBtn.disabled = false;
            useCurrentLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
          },
          (error) => {
            console.error('Error getting location:', error);
            useCurrentLocationBtn.disabled = false;
            useCurrentLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
            alert('Unable to get your location. Please enter it manually.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
      }
    });
  }

  // Update location and map marker
  function updateLocation(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else if (map) {
      marker = L.marker([lat, lng]).addTo(map);
    }
    
    map.setView([lat, lng], 15);
    latitudeInput.value = lat;
    longitudeInput.value = lng;
    coordinatesText.textContent = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Reverse geocode to get address
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      .then(res => res.json())
      .then(data => {
        const address = [
          data.locality,
          data.city,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean).join(', ');
        locationInput.value = address;
      })
      .catch(err => console.error('Error getting address:', err));
  }

  // Handle image preview
  if (imageInput) {
    imageInput.addEventListener('change', () => {
      imagePreview.innerHTML = '';
      [...imageInput.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = 'Preview';
          imagePreview.appendChild(img);

          // Extract GPS data if available
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
              try {
                const exif = EXIF.readFromBinaryFile(e.target.result);
                if (exif && exif.GPSLatitude && exif.GPSLongitude) {
                  const lat = exif.GPSLatitude[0] + exif.GPSLatitude[1]/60 + exif.GPSLatitude[2]/3600;
                  const lng = exif.GPSLongitude[0] + exif.GPSLongitude[1]/60 + exif.GPSLongitude[2]/3600;
                  updateLocation(lat, lng);
                }
              } catch (err) {
                console.log('No EXIF data found in image');
              }
            };
            reader.readAsArrayBuffer(file);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function render(list, items) {
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<p>No items yet.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      
      let locationHtml = '';
      if (item.latitude && item.longitude) {
        locationHtml = `
          <p class="location">
            📍 ${item.location}
            <br>
            <small>${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</small>
          </p>
        `;
      }

      let imagesHtml = '';
      if (item.images && item.images.length > 0) {
        imagesHtml = `
          <div class="item-images">
            ${item.images.map(img => `<img src="${img}" alt="Item image">`).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        ${locationHtml}
        ${imagesHtml}
        <p class="contact">Contact: ${item.contact}</p>
        <p class="timestamp">Posted: ${new Date(item.timestamp).toLocaleString()}</p>
      `;
      list.appendChild(card);
    });
  }

  // Handle form submission
  if (foundForm) {
    foundForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const images = [...imageInput.files].map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(images).then(imageDataUrls => {
        const newItem = {
          title: foundForm.title.value,
          description: foundForm.description.value,
          location: foundForm.location.value,
          latitude: parseFloat(latitudeInput.value),
          longitude: parseFloat(longitudeInput.value),
          contact: foundForm.contact.value,
          images: imageDataUrls,
          timestamp: Date.now()
        };

        const items = [...foundItems, newItem];
        localStorage.setItem('foundItems', JSON.stringify(items));
        foundForm.reset();
        imagePreview.innerHTML = '';
        if (marker) {
          map.removeLayer(marker);
          marker = null;
        }
        render(foundList, items);
      });
    });
  }
  
  // Lost item form handling
  const lostForm = document.getElementById('lostForm');

  if (lostForm) {
    lostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to report a lost item');
        window.location.href = 'login.html';
        return;
      }

      // Get form data
      const formData = new FormData();
      
      // Convert latitude and longitude to float
      const lat = parseFloat(latitudeInput.value);
      const lng = parseFloat(longitudeInput.value);

      // Append all required fields
      formData.append('title', lostForm.title.value);
      formData.append('description', lostForm.description.value);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('location', locationInput.value);
      formData.append('contact', lostForm.contact.value);

      // Handle file upload
      const fileInput = lostForm.querySelector('input[type="file"]');
      if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      } else {
        alert('Please select an image file');
        return;
      }

      try {
        const response = await fetch('https://backendofhackapi.onrender.com/lost/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          alert('Lost item reported successfully');
          lostForm.reset();
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
          // Clear the image preview if it exists
          const imagePreview = document.getElementById('image-preview');
          if (imagePreview) {
            imagePreview.innerHTML = '';
          }
        } else {
          throw new Error(data.detail || 'Failed to report lost item');
        }
      } catch (error) {
        console.error('Error reporting lost item:', error);
        alert(error.message || 'Failed to report lost item. Please try again.');
      }
    });
  }

  // Initial render
  if (foundList) {
    render(foundList, foundItems);
  }
});
