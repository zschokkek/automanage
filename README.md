# Fantasy Football Analyzer

A comprehensive fantasy football analysis tool that generates weekly reports for your teams across ESPN, Sleeper, and Fantrax platforms.

## Features

- **Multi-platform Support**: Import and analyze leagues from ESPN, Sleeper, and Fantrax
- **Direct League Import**: Simply enter your league ID and username/email to import your leagues
- **Weekly Performance Analysis**: Get detailed breakdowns of your team's performance
  - Total fantasy points and win/loss results
  - Top performers based on value over expected
  - Missed opportunities (points left on bench)
  - Identification of zero-point players
- **Player Trend Analysis**: Identify which players are trending up or down
- **Waiver Wire Recommendations**: Get suggestions for players to add from your league's waiver wire
- **Clean, Modern UI**: User-friendly interface for managing leagues and viewing analysis

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (for data storage)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fantasy-analyzer.git
   cd fantasy-analyzer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/fantasy-analyzer
   SESSION_SECRET=your_session_secret
   
   # Optional: Platform API credentials
   ESPN_CLIENT_ID=your_espn_client_id
   ESPN_CLIENT_SECRET=your_espn_client_secret
   ESPN_CALLBACK_URL=http://localhost:3000/api/auth/espn/callback
   ```

4. Start the server:
   ```
   npm start
   ```

5. For development with auto-restart:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### Importing a League

1. On the homepage, find the "Import Your League" section
2. Choose your platform (ESPN, Sleeper, or Fantrax)
3. Enter the required information:
   - **ESPN**: League ID, Season Year (optional), Team ID (optional)
   - **Sleeper**: League ID, Username
   - **Fantrax**: League ID, Email

4. Click "Import" and wait for the confirmation

### Generating Analysis

1. After importing a league, find it in the "Your Leagues" section
2. Click the "Analyze" button next to the league
3. The analysis will be generated and displayed in the "Weekly Analysis" section

## API Endpoints

### League Import

- `POST /api/import/espn`: Import an ESPN league
  - Body: `{ leagueId, season, teamId, email }`

- `POST /api/import/sleeper`: Import a Sleeper league
  - Body: `{ leagueId, username }`

- `POST /api/import/fantrax`: Import a Fantrax league
  - Body: `{ leagueId, email }`

### Analysis

- `POST /api/analysis/generate`: Generate analysis for a league
  - Body: `{ leagueId, week }`

- `GET /api/analysis/league/:leagueId`: Get all analyses for a league

- `GET /api/analysis/:id`: Get a specific analysis by ID

## Technical Details

### Architecture

The Fantasy Football Analyzer is built with a Node.js/Express backend and a vanilla JavaScript frontend. Data is stored in MongoDB using Mongoose for schema modeling.

### Data Models

- **User**: Stores user information and platform connections
- **League**: Stores league settings, teams, and metadata
- **Roster**: Stores team rosters for specific weeks
- **Player**: Stores player information, stats, and trends
- **Analysis**: Stores generated analysis reports

### Services

- **Platform Services**: API clients for ESPN, Sleeper, and Fantrax
- **League Import Service**: Handles direct league imports via IDs
- **Analysis Service**: Processes data and generates weekly reports

## Limitations

- **Fantrax Integration**: Limited due to lack of public API
- **Historical Data**: Limited to current and recent seasons
- **Private Leagues**: Some leagues may require authentication

## Future Enhancements

- Add support for Yahoo Fantasy
- Implement machine learning for more accurate waiver recommendations
- Add trade analysis features
- Develop mobile app version

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Fantasy football platform providers (ESPN, Sleeper, Fantrax)
- Open-source libraries and tools used in this project
