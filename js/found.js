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

  // Initialize map
  let map = null;
  let marker = null;

  if (document.getElementById('location-map')) {
    map = L.map('location-map').setView([13.0827, 80.2707], 13); // Default to Chennai
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
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

  // Replace the existing render and fetchFoundItems functions with these
  async function fetchMyItems() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("https://backendofhackapi.onrender.com/my/found", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log(data.items);
      renderCards("found-items-list", data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  function renderCards(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";

    if (!items || items.length === 0) {
      container.innerHTML = "<p>No found items reported yet.</p>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title}" onerror="this.src='assests/placeholder.png'">
        <div class="card-body">
          <h3>${item.title}</h3>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Location:</strong> ${item.location}</p>
          <p><strong>Contact:</strong> ${item.contact}</p>
          <p class="coordinates"><small>📍 ${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</small></p>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Handle form submission
  if (foundForm) {
    foundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to report a found item');
        window.location.href = 'login.html';
        return;
      }

      const formData = new FormData();
      
      const lat = parseFloat(latitudeInput.value);
      const lng = parseFloat(longitudeInput.value);

      formData.append('title', foundForm.title.value);
      formData.append('description', foundForm.description.value);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('location', locationInput.value);
      formData.append('contact', foundForm.contact.value);

      const fileInput = foundForm.querySelector('input[type="file"]');
      if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      } else {
        alert('Please select an image file');
        return;
      }

      try {
        const response = await fetch('https://backendofhackapi.onrender.com/found/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          alert('Found item reported successfully');
          foundForm.reset();
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
          if (imagePreview) {
            imagePreview.innerHTML = '';
          }
          const foundItems = await fetchFoundItems();
          render(foundList, foundItems);
        } else {
          throw new Error(data.detail || 'Failed to report found item');
        }
      } catch (error) {
        console.error('Error reporting found item:', error);
        alert(error.message || 'Failed to report found item. Please try again.');
      }
    });
  }

  // Initial render
  if (foundList) {
    fetchMyItems();
  }
});