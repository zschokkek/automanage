// Fantasy Sports Analyzer Frontend Scripts

// Global state
const state = {
  leagues: [],
  currentAnalysis: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
  charts: {
    teamPerformance: null,
    positionBreakdown: null,
    playerComparison: null,
    projectedPoints: null
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  initApp();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load any existing leagues from local storage
  loadLeagues();
  
  // Initialize dark mode
  initDarkMode();
});

// Initialize the application
function initApp() {
  console.log('Fantasy Sports Analyzer initialized');
  
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

// Initialize dark mode
function initDarkMode() {
  if (state.darkMode) {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.documentElement.classList.remove('dark');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Toggle dark mode
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  localStorage.setItem('darkMode', state.darkMode);
  initDarkMode();
  
  // Update charts if they exist
  updateChartsTheme();
}

// Update charts theme based on dark mode
function updateChartsTheme() {
  const chartTheme = state.darkMode ? {
    color: '#e5e7eb',
    gridColor: '#4b5563',
    backgroundColor: '#1f2937'
  } : {
    color: '#111827',
    gridColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  };
  
  // Update each chart with new theme
  Object.values(state.charts).forEach(chart => {
    if (chart) {
      chart.options.scales.x.grid.color = chartTheme.gridColor;
      chart.options.scales.x.ticks.color = chartTheme.color;
      chart.options.scales.y.grid.color = chartTheme.gridColor;
      chart.options.scales.y.ticks.color = chartTheme.color;
      chart.options.plugins.legend.labels.color = chartTheme.color;
      chart.options.plugins.title.color = chartTheme.color;
      chart.update();
    }
  });
}

// Set up event listeners for forms and buttons
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);

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
  
  // Custom Query Form
  document.getElementById('custom-query-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const leagueId = document.getElementById('query-league-select').value;
    const queryText = document.getElementById('query-text').value.trim();
    
    if (!leagueId) {
      showToast('Please select a league', 'error');
      return;
    }
    
    if (!queryText) {
      showToast('Please enter an analysis question', 'error');
      return;
    }
    
    generateCustomAnalysis(leagueId, queryText);
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
    
    // Update the league select dropdown
    updateLeagueSelect();
    
    // Show success message
    showToast(`Successfully imported ${platform.toUpperCase()} league!`, 'success');
    
    // Clear the form
    clearImportForm(platform);
  }, 1500);
}

// Update the league select dropdown for custom queries
function updateLeagueSelect() {
  const leagueSelect = document.getElementById('query-league-select');
  const leagues = getLeaguesFromStorage();
  
  // Clear existing options except the placeholder
  while (leagueSelect.options.length > 1) {
    leagueSelect.remove(1);
  }
  
  // Add options for each league
  leagues.forEach(league => {
    const option = document.createElement('option');
    option.value = league.id;
    option.textContent = league.name;
    leagueSelect.appendChild(option);
  });
}

// Generate custom analysis based on text input
function generateCustomAnalysis(leagueId, queryText) {
  showToast('Generating custom analysis...', 'info');
  
  // Find the selected league
  const league = state.leagues.find(l => l.id === leagueId);
  if (!league) {
    showToast('League not found', 'error');
    return;
  }
  
  // Show loading state in the analysis container
  const analysisContainer = document.getElementById('analysis-container');
  analysisContainer.innerHTML = `
    <div class="flex items-center justify-center p-8">
      <div class="loading-spinner mr-3"></div>
      <p>Generating custom analysis...</p>
    </div>
  `;
  
  // Scroll to the analysis section
  analysisContainer.scrollIntoView({ behavior: 'smooth' });
  
  // Make a real API call to generate the analysis
  fetch(`/api/analyze/custom/${league.platform}/${league.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: queryText,
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
    updateLeagueCardAfterAnalysis(league);
    
    // Display the analysis from the API
    displayAnalysisReport(league, data);
    
    // Generate visualizations based on the analysis data
    generateVisualizations(data);
    
    // Show success message
    showToast('Custom analysis generated successfully!', 'success');
  })
  .catch(error => {
    console.error('Analysis error:', error);
    
    // Display error message in the analysis container
    displayAnalysisError(error);
    
    // Show error toast
    showToast('Failed to generate analysis. See details in the analysis section.', 'error');
  });
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
    updateLeagueCardAfterAnalysis(league);
    
    // Display the analysis from the API
    displayAnalysisReport(league, data);
    
    // Generate visualizations based on the analysis data
    generateVisualizations(data);
    
    // Show success message
    showToast('Analysis generated successfully!', 'success');
  })
  .catch(error => {
    console.error('Analysis error:', error);
    
    // Display error message in the analysis container
    displayAnalysisError(error);
    
    // Show error toast
    showToast('Failed to generate analysis. See details in the analysis section.', 'error');
  });
}

// Display analysis report
function displayAnalysisReport(league, data) {
  const analysisContainer = document.getElementById('analysis-container');
  
  // Create the analysis report container
  const reportContainer = document.createElement('div');
  reportContainer.className = 'analysis-report fade-in';
  
  // Add the header
  const header = document.createElement('div');
  header.className = 'mb-6';
  header.innerHTML = `
    <h3 class="text-xl font-semibold mb-2">${league.name} - ${league.sport || 'Fantasy'} Analysis</h3>
    <div class="flex flex-wrap gap-2 mb-4">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <i class="fas fa-calendar-week mr-1"></i> Week ${getCurrentWeek()}
      </span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <i class="fas fa-trophy mr-1"></i> Season ${getCurrentSeason()}
      </span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <i class="fas ${getPlatformIcon(league.platform)} mr-1"></i> ${league.platform.toUpperCase()}
      </span>
    </div>
  `;
  reportContainer.appendChild(header);
  
  // Add the content
  const content = document.createElement('div');
  content.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
  content.innerHTML = data.reportContent.html || data.reportContent.markdown;
  reportContainer.appendChild(content);
  
  // Add the footer
  const footer = document.createElement('div');
  footer.className = 'mt-4 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center';
  footer.innerHTML = `
    <div>
      <p>Sport: ${league.sport || 'Fantasy Football'}</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div>
      <button id="download-report-btn" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center">
        <i class="fas fa-download mr-1"></i> Download Report
      </button>
    </div>
  `;
  reportContainer.appendChild(footer);
  
  // Clear the container and add the report
  analysisContainer.innerHTML = '';
  analysisContainer.appendChild(reportContainer);
  
  // Add event listener to download button
  document.getElementById('download-report-btn').addEventListener('click', () => {
    downloadReport(league, data);
  });
}

// Display analysis error
function displayAnalysisError(error) {
  const analysisContainer = document.getElementById('analysis-container');
  
  analysisContainer.innerHTML = `
    <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl p-6 fade-in">
      <h3 class="text-lg font-medium mb-2 flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i> Analysis Error
      </h3>
      <p class="mb-4">${error.message || 'Failed to generate analysis. Please try again later.'}</p>
      <div class="mt-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">Possible reasons:</p>
        <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-2">
          <li>The league data couldn't be retrieved from the platform</li>
          <li>The sport type may not be supported yet (currently supporting football, baseball, basketball, hockey)</li>
          <li>There might be an issue with your league ID or credentials</li>
          <li>The server might be experiencing technical difficulties</li>
        </ul>
        <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center mx-auto">
          <i class="fas fa-redo mr-2"></i> Try Again
        </button>
      </div>
    </div>
  `;
  
  // Add event listener to try again button
  analysisContainer.querySelector('button').addEventListener('click', () => {
    const leagueId = analysisContainer.querySelector('button').dataset.leagueId;
    const league = state.leagues.find(l => l.id === leagueId);
    if (league) {
      generateAnalysis(league);
    }
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
      displayAnalysisReport(league, data);
      
      // Generate visualizations based on the analysis data
      generateVisualizations(data);
    })
    .catch(error => {
      console.error('Analysis retrieval error:', error);
      
      // Display error message in the analysis container
      displayAnalysisError(error);
      
      // Show error toast
      showToast('Failed to retrieve analysis. See details in the analysis section.', 'error');
    });
}

// Generate visualizations based on analysis data
function generateVisualizations(data) {
  // Clear any existing charts
  Object.keys(state.charts).forEach(chartKey => {
    if (state.charts[chartKey]) {
      state.charts[chartKey].destroy();
      state.charts[chartKey] = null;
    }
  });
  
  // Extract data for visualizations
  const visualData = extractVisualizationData(data);
  
  // Create the charts
  createTeamPerformanceChart(visualData.teamPerformance);
  createPositionBreakdownChart(visualData.positionBreakdown);
  createPlayerComparisonChart(visualData.playerComparison);
  createProjectedPointsChart(visualData.projectedPoints);
}

// Extract visualization data from the analysis data
function extractVisualizationData(data) {
  // In a real implementation, this would parse the actual data
  // For now, we'll create some sample data
  
  // Sample team performance data (weekly points)
  const teamPerformance = {
    labels: Array.from({ length: getCurrentWeek() }, (_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: 'Your Team',
        data: Array.from({ length: getCurrentWeek() }, () => Math.floor(Math.random() * 50) + 80),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'League Average',
        data: Array.from({ length: getCurrentWeek() }, () => Math.floor(Math.random() * 30) + 90),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Sample position breakdown data
  const positionBreakdown = {
    labels: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
    datasets: [
      {
        label: 'Position Strength',
        data: [
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Sample player comparison data
  const playerComparison = {
    labels: ['Points', 'Consistency', 'Upside', 'Schedule', 'Health'],
    datasets: [
      {
        label: 'Player 1',
        data: [
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70
        ],
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      },
      {
        label: 'Player 2',
        data: [
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10b981'
      }
    ]
  };
  
  // Sample projected points data
  const projectedPoints = {
    labels: Array.from({ length: 5 }, (_, i) => `Week ${getCurrentWeek() + i + 1}`),
    datasets: [
      {
        label: 'Projected Points',
        data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 80),
        backgroundColor: [
          'rgba(79, 70, 229, 0.7)',
          'rgba(79, 70, 229, 0.7)',
          'rgba(79, 70, 229, 0.7)',
          'rgba(79, 70, 229, 0.7)',
          'rgba(79, 70, 229, 0.7)'
        ],
        borderColor: [
          '#4f46e5',
          '#4f46e5',
          '#4f46e5',
          '#4f46e5',
          '#4f46e5'
        ],
        borderWidth: 1
      }
    ]
  };
  
  return {
    teamPerformance,
    positionBreakdown,
    playerComparison,
    projectedPoints
  };
}

// Create team performance chart
function createTeamPerformanceChart(data) {
  const ctx = document.getElementById('team-performance-chart').getContext('2d');
  
  // Set chart options based on dark mode
  const gridColor = state.darkMode ? '#4b5563' : '#e5e7eb';
  const textColor = state.darkMode ? '#e5e7eb' : '#111827';
  
  state.charts.teamPerformance = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor
          }
        },
        title: {
          display: false,
          text: 'Team Performance',
          color: textColor
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
          titleColor: state.darkMode ? '#e5e7eb' : '#111827',
          bodyColor: state.darkMode ? '#e5e7eb' : '#111827',
          borderColor: state.darkMode ? '#4b5563' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          },
          suggestedMin: 50,
          suggestedMax: 150
        }
      }
    }
  });
}

// Create position breakdown chart
function createPositionBreakdownChart(data) {
  const ctx = document.getElementById('position-breakdown-chart').getContext('2d');
  
  // Set chart options based on dark mode
  const gridColor = state.darkMode ? '#4b5563' : '#e5e7eb';
  const textColor = state.darkMode ? '#e5e7eb' : '#111827';
  
  state.charts.positionBreakdown = new Chart(ctx, {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: {
            color: textColor
          }
        },
        title: {
          display: false,
          text: 'Position Breakdown',
          color: textColor
        },
        tooltip: {
          backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
          titleColor: state.darkMode ? '#e5e7eb' : '#111827',
          bodyColor: state.darkMode ? '#e5e7eb' : '#111827',
          borderColor: state.darkMode ? '#4b5563' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          },
          ticks: {
            color: textColor,
            backdropColor: state.darkMode ? '#1f2937' : '#ffffff'
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });
}

// Create player comparison chart
function createPlayerComparisonChart(data) {
  const ctx = document.getElementById('player-comparison-chart').getContext('2d');
  
  // Set chart options based on dark mode
  const gridColor = state.darkMode ? '#4b5563' : '#e5e7eb';
  const textColor = state.darkMode ? '#e5e7eb' : '#111827';
  
  state.charts.playerComparison = new Chart(ctx, {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor
          }
        },
        title: {
          display: false,
          text: 'Player Comparison',
          color: textColor
        },
        tooltip: {
          backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
          titleColor: state.darkMode ? '#e5e7eb' : '#111827',
          bodyColor: state.darkMode ? '#e5e7eb' : '#111827',
          borderColor: state.darkMode ? '#4b5563' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          },
          ticks: {
            color: textColor,
            backdropColor: state.darkMode ? '#1f2937' : '#ffffff'
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });
}

// Create projected points chart
function createProjectedPointsChart(data) {
  const ctx = document.getElementById('projected-points-chart').getContext('2d');
  
  // Set chart options based on dark mode
  const gridColor = state.darkMode ? '#4b5563' : '#e5e7eb';
  const textColor = state.darkMode ? '#e5e7eb' : '#111827';
  
  state.charts.projectedPoints = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: {
            color: textColor
          }
        },
        title: {
          display: false,
          text: 'Projected Points',
          color: textColor
        },
        tooltip: {
          backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
          titleColor: state.darkMode ? '#e5e7eb' : '#111827',
          bodyColor: state.darkMode ? '#e5e7eb' : '#111827',
          borderColor: state.darkMode ? '#4b5563' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          },
          suggestedMin: 50,
          suggestedMax: 150
        }
      }
    }
  });
}

// Download analysis report as PDF
function downloadReport(league, data) {
  // In a real implementation, this would generate a PDF
  // For now, we'll just show a toast
  showToast('Report download started...', 'info');
  
  // Simulate download delay
  setTimeout(() => {
    showToast('Report downloaded successfully!', 'success');
  }, 1500);
}

// Get platform icon
function getPlatformIcon(platform) {
  switch (platform) {
    case 'espn':
      return 'fa-football-ball';
    case 'sleeper':
      return 'fa-moon';
    case 'fantrax':
      return 'fa-chart-line';
    default:
      return 'fa-trophy';
  }
}

// Add a league to the UI
function addLeagueToUI(league) {
  const leaguesContainer = document.getElementById('leagues-container');
  
  // Remove the "no leagues" message if it exists
  const noLeaguesMessage = leaguesContainer.querySelector('.text-gray-500.italic, .text-gray-400.italic');
  if (noLeaguesMessage) {
    leaguesContainer.removeChild(noLeaguesMessage);
  }
  
  // Create the league card
  const leagueCard = document.createElement('div');
  leagueCard.className = 'league-card bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 fade-in shadow-md hover:shadow-lg';
  leagueCard.dataset.leagueId = league.id;
  
  // Format the date
  const importDate = new Date(league.importedAt).toLocaleDateString();
  
  leagueCard.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-medium">${league.name}</h3>
        <div class="mt-1 flex items-center space-x-2">
          <span class="platform-badge platform-${league.platform}">${league.platform}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">Season ${league.season}</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Imported on ${importDate}</p>
      </div>
      <div class="flex space-x-2">
        <button class="analyze-btn px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center" data-league-id="${league.id}">
          <i class="fas fa-chart-bar mr-1"></i> Analyze
        </button>
        <button class="remove-btn px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center" data-league-id="${league.id}">
          <i class="fas fa-trash-alt mr-1"></i> Remove
        </button>
      </div>
    </div>
    ${league.lastAnalysis ? 
      `<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm dark:text-gray-300">Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}</p>
        <button class="view-analysis-btn mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center" data-league-id="${league.id}">
          <i class="fas fa-eye mr-1"></i> View Analysis
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
  
  // Add to state
  state.leagues.push(league);
}

// Update a league card after analysis
function updateLeagueCardAfterAnalysis(league) {
  const leagueCard = document.querySelector(`.league-card[data-league-id="${league.id}"]`);
  if (leagueCard) {
    const lastAnalysisSection = leagueCard.querySelector('.border-t');
    if (lastAnalysisSection) {
      lastAnalysisSection.querySelector('p').textContent = `Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}`;
    } else {
      const newSection = document.createElement('div');
      newSection.className = 'mt-3 pt-3 border-t border-gray-200 dark:border-gray-700';
      newSection.innerHTML = `
        <p class="text-sm dark:text-gray-300">Last analysis: ${new Date(league.lastAnalysis).toLocaleString()}</p>
        <button class="view-analysis-btn mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center" data-league-id="${league.id}">
          <i class="fas fa-eye mr-1"></i> View Analysis
        </button>
      `;
      
      newSection.querySelector('.view-analysis-btn').addEventListener('click', () => {
        viewAnalysis(league);
      });
      
      leagueCard.appendChild(newSection);
    }
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
  
  // Set icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle text-green-500"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle text-red-500"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle text-yellow-500"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle text-blue-500"></i>';
  }
  
  toast.innerHTML = `
    <div class="flex items-center">
      <div class="mr-3">
        ${icon}
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
    
    // Update the league select dropdown
    updateLeagueSelect();
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
    
    // Update state
    const stateIndex = state.leagues.findIndex(l => l.id === league.id);
    if (stateIndex !== -1) {
      state.leagues[stateIndex] = league;
    }
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

// Remove a league
function removeLeague(leagueId) {
  // Remove from storage
  const leagues = getLeaguesFromStorage();
  const updatedLeagues = leagues.filter(league => league.id !== leagueId);
  localStorage.setItem('fantasy-leagues', JSON.stringify(updatedLeagues));
  
  // Remove from state
  state.leagues = state.leagues.filter(league => league.id !== leagueId);
  
  // Remove from UI
  const leagueCard = document.querySelector(`.league-card[data-league-id="${leagueId}"]`);
  if (leagueCard) {
    leagueCard.classList.add('fade-out');
    setTimeout(() => {
      leagueCard.remove();
      
      // If no leagues left, show the "no leagues" message
      const leaguesContainer = document.getElementById('leagues-container');
      if (leaguesContainer.children.length === 0) {
        leaguesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">No leagues imported yet. Use the form to import your leagues.</p>';
      }
      
      // Update the league select dropdown
      updateLeagueSelect();
    }, 300);
  }
  
  showToast('League removed successfully', 'success');
}
