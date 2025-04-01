// Fantasy Football Analyzer Frontend Scripts

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  initApp();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load any existing leagues from local storage
  loadLeagues();
});

// Initialize the application
function initApp() {
  console.log('Fantasy Football Analyzer initialized');
  
  // Check if API is available
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      console.log('API Status:', data);
    })
    .catch(error => {
      console.error('API Error:', error);
      showToast('Server connection error. Please try again later.', 'error');
    });
}

// Set up event listeners for forms and buttons
function setupEventListeners() {
  // ESPN League Import Form
  document.getElementById('espn-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const leagueId = document.getElementById('espn-league-id').value.trim();
    const year = document.getElementById('espn-year').value.trim();
    const teamId = document.getElementById('espn-team-id').value.trim();
    
    if (!leagueId) {
      showToast('Please enter a league ID', 'error');
      return;
    }
    
    importLeague('espn', { leagueId, year, teamId });
  });
  
  // Sleeper League Import Form
  document.getElementById('sleeper-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const leagueId = document.getElementById('sleeper-league-id').value.trim();
    const username = document.getElementById('sleeper-username').value.trim();
    
    if (!leagueId) {
      showToast('Please enter a league ID', 'error');
      return;
    }
    
    if (!username) {
      showToast('Please enter your Sleeper username', 'error');
      return;
    }
    
    importLeague('sleeper', { leagueId, username });
  });
  
  // Fantrax League Import Form
  document.getElementById('fantrax-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const leagueId = document.getElementById('fantrax-league-id').value.trim();
    const email = document.getElementById('fantrax-email').value.trim();
    
    if (!leagueId) {
      showToast('Please enter a league ID', 'error');
      return;
    }
    
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }
    
    importLeague('fantrax', { leagueId, email });
  });
}

// Import a league from a platform
function importLeague(platform, data) {
  showToast(`Importing ${platform.toUpperCase()} league...`, 'info');
  
  // In a real implementation, we would send this data to the server
  // For now, we'll simulate the import process
  
  // Simulate API call delay
  setTimeout(() => {
    // Generate a unique ID for the league
    const leagueId = `${platform}-${data.leagueId}`;
    
    // Check if league already exists
    const existingLeagues = getLeaguesFromStorage();
    if (existingLeagues.some(league => league.id === leagueId)) {
      showToast('This league has already been imported', 'error');
      return;
    }
    
    // Create a new league object
    const league = {
      id: leagueId,
      platform,
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} League ${data.leagueId}`,
      season: data.year || new Date().getFullYear(),
      teamId: data.teamId || '1',
      importedAt: new Date().toISOString(),
      lastAnalysis: null
    };
    
    // Save the league to storage
    saveLeagueToStorage(league);
    
    // Update the UI
    addLeagueToUI(league);
    
    // Show success message
    showToast(`Successfully imported ${platform.toUpperCase()} league!`, 'success');
    
    // Clear the form
    clearImportForm(platform);
  }, 1500);
}

// Add a league to the UI
function addLeagueToUI(league) {
  const leaguesContainer = document.getElementById('leagues-container');
  
  // Remove the "no leagues" message if it exists
  const noLeaguesMessage = leaguesContainer.querySelector('.text-gray-500.italic');
  if (noLeaguesMessage) {
    leaguesContainer.removeChild(noLeaguesMessage);
  }
  
  // Create the league card
  const leagueCard = document.createElement('div');
  leagueCard.className = 'league-card bg-gray-50 rounded-lg p-4 border border-gray-200 fade-in';
  leagueCard.dataset.leagueId = league.id;
  
  // Format the date
  const importDate = new Date(league.importedAt).toLocaleDateString();
  
  leagueCard.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-medium">${league.name}</h3>
        <div class="mt-1 flex items-center space-x-2">
          <span class="platform-badge platform-${league.platform}">${league.platform}</span>
          <span class="text-sm text-gray-500">Season ${league.season}</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">Imported on ${importDate}</p>
      </div>
      <div class="flex space-x-2">
        <button class="analyze-btn px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" data-league-id="${league.id}">
          Analyze
        </button>
        <button class="remove-btn px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700" data-league-id="${league.id}">
          Remove
        </button>
      </div>
    </div>
    ${league.lastAnalysis ? 
      `<div class="mt-3 pt-3 border-t border-gray-200">
        <p class="text-sm">Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}</p>
        <button class="view-analysis-btn mt-2 text-sm text-blue-600 hover:underline" data-league-id="${league.id}">
          View Analysis
        </button>
      </div>` : 
      ''}
  `;
  
  // Add event listeners to the buttons
  leagueCard.querySelector('.analyze-btn').addEventListener('click', () => {
    generateAnalysis(league);
  });
  
  leagueCard.querySelector('.remove-btn').addEventListener('click', () => {
    removeLeague(league.id);
  });
  
  if (league.lastAnalysis) {
    leagueCard.querySelector('.view-analysis-btn').addEventListener('click', () => {
      viewAnalysis(league);
    });
  }
  
  // Add the card to the container
  leaguesContainer.appendChild(leagueCard);
}

// Generate analysis for a league
function generateAnalysis(league) {
  showToast(`Generating analysis for ${league.name}...`, 'info');
  
  // Show loading state in the analysis container
  const analysisContainer = document.getElementById('analysis-container');
  analysisContainer.innerHTML = `
    <div class="flex items-center justify-center p-8">
      <div class="loading-spinner mr-3"></div>
      <p>Generating analysis...</p>
    </div>
  `;
  
  // Scroll to the analysis section
  analysisContainer.scrollIntoView({ behavior: 'smooth' });
  
  // Make a real API call to generate the analysis
  fetch(`/api/analyze/${league.platform}/${league.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      week: getCurrentWeek(),
      season: getCurrentSeason(),
      teamId: league.teamId || null
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (!data || !data.reportContent) {
      throw new Error('No analysis data returned');
    }
    
    // Update the league's last analysis timestamp
    league.lastAnalysis = new Date().toISOString();
    
    // Save the updated league to storage
    saveLeagueToStorage(league);
    
    // Update the league card in the UI
    const leagueCard = document.querySelector(`.league-card[data-league-id="${league.id}"]`);
    if (leagueCard) {
      const lastAnalysisSection = leagueCard.querySelector('.border-t');
      if (lastAnalysisSection) {
        lastAnalysisSection.querySelector('p').textContent = `Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}`;
      } else {
        const newSection = document.createElement('div');
        newSection.className = 'mt-3 pt-3 border-t border-gray-200';
        newSection.innerHTML = `
          <p class="text-sm">Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}</p>
          <button class="view-analysis-btn mt-2 text-sm text-blue-600 hover:underline" data-league-id="${league.id}">
            View Analysis
          </button>
        `;
        
        newSection.querySelector('.view-analysis-btn').addEventListener('click', () => {
          viewAnalysis(league);
        });
        
        leagueCard.appendChild(newSection);
      }
    }
    
    // Display the analysis from the API
    analysisContainer.innerHTML = `
      <div class="analysis-report fade-in">
        <h3 class="text-xl font-semibold mb-4">${league.name} - ${league.sport || 'Fantasy'} Analysis</h3>
        <div class="bg-white p-4 rounded shadow">
          ${data.reportContent.html || data.reportContent.markdown}
        </div>
        <div class="mt-4 text-sm text-gray-500">
          <p>Sport: ${league.sport || 'Unknown'}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    // Show success message
    showToast('Analysis generated successfully!', 'success');
  })
  .catch(error => {
    console.error('Analysis error:', error);
    
    // Display error message in the analysis container
    analysisContainer.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-800 rounded p-4 fade-in">
        <h3 class="text-lg font-medium mb-2">Analysis Error</h3>
        <p>${error.message || 'Failed to generate analysis. Please try again later.'}</p>
        <div class="mt-4">
          <p class="text-sm text-gray-700">Possible reasons:</p>
          <ul class="list-disc list-inside text-sm text-gray-700 mt-2">
            <li>The league data couldn't be retrieved from the platform</li>
            <li>The sport type may not be supported yet (currently supporting football, baseball, basketball, hockey)</li>
            <li>There might be an issue with your league ID or credentials</li>
            <li>The server might be experiencing technical difficulties</li>
          </ul>
          <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" 
                  onclick="generateAnalysis(${JSON.stringify(league)})">
            Try Again
          </button>
        </div>
      </div>
    `;
    
    // Show error toast
    showToast('Failed to generate analysis. See details in the analysis section.', 'error');
  });
}

// View a previously generated analysis
function viewAnalysis(league) {
  const analysisContainer = document.getElementById('analysis-container');
  
  // Show loading state in the analysis container
  analysisContainer.innerHTML = `
    <div class="flex items-center justify-center p-8">
      <div class="loading-spinner mr-3"></div>
      <p>Loading analysis...</p>
    </div>
  `;
  
  // Scroll to the analysis section
  analysisContainer.scrollIntoView({ behavior: 'smooth' });
  
  // Fetch the latest analysis from the API
  fetch(`/api/analysis/${league.platform}/${league.id}?week=${getCurrentWeek()}&season=${getCurrentSeason()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.reportContent) {
        throw new Error('No analysis data available');
      }
      
      // Display the analysis from the API
      analysisContainer.innerHTML = `
        <div class="analysis-report fade-in">
          <h3 class="text-xl font-semibold mb-4">${league.name} - ${league.sport || 'Fantasy'} Analysis</h3>
          <div class="bg-white p-4 rounded shadow">
            ${data.reportContent.html || data.reportContent.markdown}
          </div>
          <div class="mt-4 text-sm text-gray-500">
            <p>Sport: ${league.sport || 'Unknown'}</p>
            <p>Generated: ${new Date(data.generatedAt || Date.now()).toLocaleString()}</p>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('Analysis retrieval error:', error);
      
      // Display error message in the analysis container
      analysisContainer.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-800 rounded p-4 fade-in">
          <h3 class="text-lg font-medium mb-2">Analysis Error</h3>
          <p>${error.message || 'Failed to retrieve analysis. Please try again later.'}</p>
          <div class="mt-4">
            <p class="text-sm text-gray-700">Possible reasons:</p>
            <ul class="list-disc list-inside text-sm text-gray-700 mt-2">
              <li>No analysis has been generated yet for this league</li>
              <li>The analysis data may have expired or been deleted</li>
              <li>There might be a connection issue with the server</li>
            </ul>
            <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" 
                    onclick="generateAnalysis(${JSON.stringify(league)})">
              Generate New Analysis
            </button>
          </div>
        </div>
      `;
      
      // Show error toast
      showToast('Failed to retrieve analysis. See details in the analysis section.', 'error');
    });
}

// Remove a league
function removeLeague(leagueId) {
  // Remove from storage
  const leagues = getLeaguesFromStorage();
  const updatedLeagues = leagues.filter(league => league.id !== leagueId);
  localStorage.setItem('fantasy-leagues', JSON.stringify(updatedLeagues));
  
  // Remove from UI
  const leagueCard = document.querySelector(`.league-card[data-league-id="${leagueId}"]`);
  if (leagueCard) {
    leagueCard.classList.add('fade-out');
    setTimeout(() => {
      leagueCard.remove();
      
      // If no leagues left, show the "no leagues" message
      const leaguesContainer = document.getElementById('leagues-container');
      if (leaguesContainer.children.length === 0) {
        leaguesContainer.innerHTML = '<p class="text-gray-500 italic">No leagues imported yet. Use the form to import your leagues.</p>';
      }
    }, 300);
  }
  
  showToast('League removed successfully', 'success');
}

// Load leagues from local storage
function loadLeagues() {
  const leagues = getLeaguesFromStorage();
  
  if (leagues.length > 0) {
    // Clear the "no leagues" message
    const leaguesContainer = document.getElementById('leagues-container');
    leaguesContainer.innerHTML = '';
    
    // Add each league to the UI
    leagues.forEach(league => {
      addLeagueToUI(league);
    });
  }
}

// Get leagues from local storage
function getLeaguesFromStorage() {
  const leaguesJson = localStorage.getItem('fantasy-leagues');
  return leaguesJson ? JSON.parse(leaguesJson) : [];
}

// Save a league to local storage
function saveLeagueToStorage(league) {
  const leagues = getLeaguesFromStorage();
  
  // Check if the league already exists
  const existingIndex = leagues.findIndex(l => l.id === league.id);
  
  if (existingIndex !== -1) {
    // Update existing league
    leagues[existingIndex] = league;
  } else {
    // Add new league
    leagues.push(league);
  }
  
  localStorage.setItem('fantasy-leagues', JSON.stringify(leagues));
}

// Clear an import form
function clearImportForm(platform) {
  switch (platform) {
    case 'espn':
      document.getElementById('espn-league-id').value = '';
      document.getElementById('espn-team-id').value = '';
      break;
    case 'sleeper':
      document.getElementById('sleeper-league-id').value = '';
      document.getElementById('sleeper-username').value = '';
      break;
    case 'fantrax':
      document.getElementById('fantrax-league-id').value = '';
      document.getElementById('fantrax-email').value = '';
      break;
  }
}

// Show a toast notification
function showToast(message, type = 'info') {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => {
    toast.remove();
  });
  
  // Create the toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="flex items-center">
      <div class="mr-2">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </div>
      <div>
        <p>${message}</p>
      </div>
    </div>
  `;
  
  // Add the toast to the document
  document.body.appendChild(toast);
  
  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Helper function to get the current fantasy week
function getCurrentWeek() {
  // This is a simplified calculation - in a real app, you'd use the actual fantasy schedule
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const diffDays = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(17, Math.ceil(diffDays / 7)));
}

// Helper function to get the current season year
function getCurrentSeason() {
  const now = new Date();
  // If we're in the later part of the year (after July), use the current year
  // Otherwise, use the previous year (for playoffs/end of season)
  return now.getMonth() > 6 ? now.getFullYear() : now.getFullYear() - 1;
}
