const logger = require('../utils/logger');
const Analysis = require('../models/Analysis');
const Player = require('../models/Player');
const Roster = require('../models/Roster');
const League = require('../models/League');

class AnalysisService {
  /**
   * Generate a weekly analysis report for a user's team
   * @param {Object} user - User object
   * @param {Object} league - League object
   * @param {Object} roster - Roster object with player data
   * @param {number} week - Week number
   * @param {number} season - Season year
   * @returns {Promise<Object>} Analysis report
   */
  async generateWeeklyAnalysis(user, league, roster, week, season) {
    try {
      logger.info(`Generating weekly analysis for user ${user._id}, league ${league._id}, week ${week}`);
      
      // Step 1: Analyze weekly performance
      const weeklyPerformance = await this.analyzeWeeklyPerformance(roster, league.sport);
      
      // Step 2: Identify player trends
      const playerTrends = await this.identifyPlayerTrends(roster, league._id, week, season, league.sport);
      
      // Step 3: Scan waiver wire
      const waiverRecommendations = await this.scanWaiverWire(league, roster, week, season);
      
      // Step 4: Generate final report content
      const reportContent = this.generateReportContent(
        weeklyPerformance, 
        playerTrends, 
        waiverRecommendations,
        league,
        week,
        season
      );
      
      // Create or update analysis in database
      const analysis = await Analysis.findOneAndUpdate(
        { 
          user: user._id, 
          league: league._id, 
          week, 
          season 
        },
        {
          weeklyPerformance,
          playerTrends,
          waiverRecommendations,
          reportContent,
          generatedAt: new Date()
        },
        { 
          new: true, 
          upsert: true 
        }
      );
      
      return analysis;
    } catch (error) {
      logger.error(`Error generating weekly analysis: ${error.message}`);
      throw new Error(`Failed to generate weekly analysis: ${error.message}`);
    }
  }

  /**
   * Analyze weekly performance of a roster
   * @param {Object} roster - Roster object with player data
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {Promise<Object>} Weekly performance analysis
   */
  async analyzeWeeklyPerformance(roster, sport = 'football') {
    try {
      // Calculate total points
      const totalPoints = roster.players.reduce((total, player) => {
        return total + (player.score || 0);
      }, 0);
      
      // Determine result
      const result = roster.matchup ? roster.matchup.result : 'pending';
      
      // Find top performers (based on value over expected)
      const topPerformers = roster.players
        .filter(player => player.starter && player.score > 0)
        .map(player => {
          const valueOverExpected = player.score - (player.projectedScore || 0);
          return {
            player: player.player,
            points: player.score,
            valueOverExpected,
            analysis: this.generatePlayerPerformanceAnalysis(player, valueOverExpected, sport)
          };
        })
        .sort((a, b) => b.valueOverExpected - a.valueOverExpected)
        .slice(0, 3);
      
      // Find missed opportunities (points left on bench)
      const missedOpportunities = roster.players
        .filter(player => !player.starter && player.score > 0)
        .map(player => {
          // Find the starter with the lowest score in the same position
          const worstStarter = roster.players
            .filter(p => p.starter && p.position === player.position && p.score < player.score)
            .sort((a, b) => a.score - b.score)[0];
          
          if (worstStarter) {
            return {
              player: player.player,
              points: player.score,
              analysis: `${player.score} points left on your bench. Could have replaced ${worstStarter.player.name} who scored ${worstStarter.score} points.`
            };
          }
          
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => b.points - a.points);
      
      // Find zero-point players
      const zeroPointPlayers = roster.players
        .filter(player => player.starter && (player.score === 0 || player.score === null))
        .map(player => {
          return {
            player: player.player,
            reason: this.determineZeroPointReason(player, sport)
          };
        });
      
      return {
        totalPoints,
        result,
        topPerformers,
        missedOpportunities,
        zeroPointPlayers
      };
    } catch (error) {
      logger.error(`Error analyzing weekly performance: ${error.message}`);
      throw new Error(`Failed to analyze weekly performance: ${error.message}`);
    }
  }

  /**
   * Generate analysis text for a player's performance
   * @param {Object} player - Player object with score and projection
   * @param {number} valueOverExpected - Value over expected points
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {string} Analysis text
   */
  generatePlayerPerformanceAnalysis(player, valueOverExpected, sport = 'football') {
    // Generic analysis that works for any sport
    if (valueOverExpected > 10) {
      return `Exceptional performance, exceeding projections by ${valueOverExpected.toFixed(1)} points.`;
    } else if (valueOverExpected > 5) {
      return `Strong performance, outperforming expectations by ${valueOverExpected.toFixed(1)} points.`;
    } else if (valueOverExpected > 0) {
      return `Solid performance, slightly above projections by ${valueOverExpected.toFixed(1)} points.`;
    } else if (valueOverExpected > -5) {
      return `Slightly underperformed expectations by ${Math.abs(valueOverExpected).toFixed(1)} points.`;
    } else {
      return `Disappointing performance, falling short of projections by ${Math.abs(valueOverExpected).toFixed(1)} points.`;
    }
  }

  /**
   * Determine reason for a player scoring zero points
   * @param {Object} player - Player object
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {string} Reason for zero points
   */
  determineZeroPointReason(player, sport = 'football') {
    // Generic reasons that work for any sport
    if (sport === 'football') {
      return "Player may have been injured, inactive, or had limited opportunities in the offense.";
    } else if (sport === 'baseball') {
      return "Player may have had a day off, faced a tough matchup, or had limited plate appearances.";
    } else if (sport === 'basketball') {
      return "Player may have been injured, received limited minutes, or had an off night shooting.";
    } else if (sport === 'hockey') {
      return "Player may have been scratched, received limited ice time, or had no scoring opportunities.";
    } else {
      return "Player may have been inactive or had limited opportunities to score fantasy points.";
    }
  }

  /**
   * Identify player trends based on recent performance
   * @param {Object} roster - Roster object with player data
   * @param {string} leagueId - League ID
   * @param {number} week - Current week
   * @param {number} season - Season year
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {Promise<Object>} Player trends
   */
  async identifyPlayerTrends(roster, leagueId, week, season, sport = 'football') {
    try {
      // Get previous weeks' rosters for comparison
      const previousWeeks = [];
      for (let i = 1; i <= 3; i++) {
        if (week - i > 0) {
          const prevRoster = await Roster.findOne({
            league: leagueId,
            'team.platformTeamId': roster.team.platformTeamId,
            week: week - i,
            season
          }).populate('players.player');
          
          if (prevRoster) {
            previousWeeks.push(prevRoster);
          }
        }
      }
      
      // Analyze trends for each player
      const trendingUp = [];
      const trendingDown = [];
      
      for (const playerEntry of roster.players) {
        const player = await Player.findById(playerEntry.player);
        if (!player) continue;
        
        // Get player's performance in previous weeks
        const playerHistory = previousWeeks.map(prevRoster => {
          const prevPlayerEntry = prevRoster.players.find(p => 
            p.player && p.player._id.toString() === player._id.toString()
          );
          return prevPlayerEntry ? prevPlayerEntry.score : null;
        }).filter(Boolean);
        
        if (playerHistory.length > 0) {
          const currentScore = playerEntry.score || 0;
          const avgPreviousScore = playerHistory.reduce((sum, score) => sum + score, 0) / playerHistory.length;
          
          // Analyze trend
          if (currentScore > avgPreviousScore * 1.2) {
            // Player is trending up (20% improvement)
            trendingUp.push({
              player: player._id,
              reason: this.generateTrendReason(player, 'up', currentScore, avgPreviousScore, sport)
            });
          } else if (currentScore < avgPreviousScore * 0.8) {
            // Player is trending down (20% decline)
            trendingDown.push({
              player: player._id,
              reason: this.generateTrendReason(player, 'down', currentScore, avgPreviousScore, sport)
            });
          }
        }
      }
      
      return {
        trendingUp,
        trendingDown
      };
    } catch (error) {
      logger.error(`Error identifying player trends: ${error.message}`);
      throw new Error(`Failed to identify player trends: ${error.message}`);
    }
  }

  /**
   * Generate reason text for a player trend
   * @param {Object} player - Player object
   * @param {string} trend - Trend direction ('up' or 'down')
   * @param {number} currentScore - Current week score
   * @param {number} avgPreviousScore - Average previous weeks score
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {string} Trend reason
   */
  generateTrendReason(player, trend, currentScore, avgPreviousScore, sport = 'football') {
    const difference = Math.abs(currentScore - avgPreviousScore).toFixed(1);
    
    if (trend === 'up') {
      if (sport === 'football') {
        return `Averaging ${difference} more points than previous weeks. Increased role in offense.`;
      } else if (sport === 'baseball') {
        return `Averaging ${difference} more points than previous weeks. Improved hitting or pitching performance.`;
      } else if (sport === 'basketball') {
        return `Averaging ${difference} more points than previous weeks. Increased minutes or usage rate.`;
      } else if (sport === 'hockey') {
        return `Averaging ${difference} more points than previous weeks. Increased ice time or power play opportunities.`;
      } else {
        return `Averaging ${difference} more points than previous weeks. Improved performance.`;
      }
    } else {
      if (sport === 'football') {
        return `Averaging ${difference} fewer points than previous weeks. Decreased opportunities or efficiency.`;
      } else if (sport === 'baseball') {
        return `Averaging ${difference} fewer points than previous weeks. Slumping at the plate or struggling on the mound.`;
      } else if (sport === 'basketball') {
        return `Averaging ${difference} fewer points than previous weeks. Decreased minutes or shooting efficiency.`;
      } else if (sport === 'hockey') {
        return `Averaging ${difference} fewer points than previous weeks. Reduced ice time or offensive opportunities.`;
      } else {
        return `Averaging ${difference} fewer points than previous weeks. Declining performance.`;
      }
    }
  }

  /**
   * Scan waiver wire for potential pickups
   * @param {Object} league - League object
   * @param {Object} roster - Roster object
   * @param {number} week - Current week
   * @param {number} season - Season year
   * @returns {Promise<Array>} Waiver recommendations
   */
  async scanWaiverWire(league, roster, week, season) {
    try {
      // In a real implementation, we would query the platform API for available players
      // For now, we'll return a placeholder implementation
      
      // Get all players on the roster
      const rosterPlayerIds = roster.players.map(p => p.player._id.toString());
      
      // Find players not on the roster who have good recent performance
      const availablePlayers = await Player.find({
        _id: { $nin: rosterPlayerIds }
      }).limit(50);
      
      // Simulate waiver recommendations
      const recommendations = availablePlayers
        .slice(0, 5)
        .map((player, index) => {
          const priority = index === 0 ? 'high-priority' : (index < 3 ? 'streamer' : 'stash');
          const ownershipPercentage = Math.floor(Math.random() * 30); // Simulate low ownership percentage
          
          return {
            player: player._id,
            priority,
            reason: this.generateWaiverRecommendationReason(player, priority, league.sport),
            ownershipPercentage
          };
        });
      
      return recommendations;
    } catch (error) {
      logger.error(`Error scanning waiver wire: ${error.message}`);
      throw new Error(`Failed to scan waiver wire: ${error.message}`);
    }
  }

  /**
   * Generate reason text for a waiver recommendation
   * @param {Object} player - Player object
   * @param {string} priority - Recommendation priority
   * @param {string} sport - Sport type (football, baseball, etc.)
   * @returns {string} Recommendation reason
   */
  generateWaiverRecommendationReason(player, priority, sport = 'football') {
    if (priority === 'high-priority') {
      if (sport === 'football') {
        return `Emerging as a key offensive weapon with consistent targets/touches. Add immediately.`;
      } else if (sport === 'baseball') {
        return `Hot streak at the plate or dominant pitching performances. Add immediately.`;
      } else if (sport === 'basketball') {
        return `Increased minutes and production, likely to maintain larger role. Add immediately.`;
      } else if (sport === 'hockey') {
        return `Increased ice time and scoring opportunities. Add immediately.`;
      } else {
        return `Showing significant improvement in recent performances. Add immediately.`;
      }
    } else if (priority === 'streamer') {
      if (sport === 'football') {
        return `Good matchup next week against a weak defense. Consider for short-term value.`;
      } else if (sport === 'baseball') {
        return `Favorable upcoming matchups or ballparks. Consider for short-term value.`;
      } else if (sport === 'basketball') {
        return `Favorable schedule or temporary increase in minutes. Consider for short-term value.`;
      } else if (sport === 'hockey') {
        return `Favorable upcoming matchups or temporary line promotion. Consider for short-term value.`;
      } else {
        return `Favorable upcoming schedule. Consider for short-term value.`;
      }
    } else {
      if (sport === 'football') {
        return `Potential for increased role due to injury or depth chart changes. Monitor situation.`;
      } else if (sport === 'baseball') {
        return `Showing signs of breaking out or potential role change. Monitor situation.`;
      } else if (sport === 'basketball') {
        return `Could see increased minutes due to team injuries or rotation changes. Monitor situation.`;
      } else if (sport === 'hockey') {
        return `Potential for line promotion or power play time. Monitor situation.`;
      } else {
        return `Showing potential for increased role or production. Monitor situation.`;
      }
    }
  }

  /**
   * Generate final report content in markdown and HTML formats
   * @param {Object} weeklyPerformance - Weekly performance analysis
   * @param {Object} playerTrends - Player trends analysis
   * @param {Array} waiverRecommendations - Waiver recommendations
   * @param {Object} league - League object
   * @param {number} week - Week number
   * @param {number} season - Season year
   * @returns {Object} Report content
   */
  generateReportContent(weeklyPerformance, playerTrends, waiverRecommendations, league, week, season) {
    // Generate markdown report
    const markdown = this.generateMarkdownReport(
      weeklyPerformance,
      playerTrends,
      waiverRecommendations,
      league,
      week,
      season
    );
    
    // Convert markdown to HTML (in a real implementation, we would use a markdown parser)
    const html = markdown; // Placeholder - would convert to HTML in real implementation
    
    return {
      markdown,
      html
    };
  }

  /**
   * Generate markdown report
   * @param {Object} weeklyPerformance - Weekly performance analysis
   * @param {Object} playerTrends - Player trends analysis
   * @param {Array} waiverRecommendations - Waiver recommendations
   * @param {Object} league - League object
   * @param {number} week - Week number
   * @param {number} season - Season year
   * @returns {string} Markdown report
   */
  generateMarkdownReport(weeklyPerformance, playerTrends, waiverRecommendations, league, week, season) {
    // Format the report in markdown
    const sportName = league.sport.charAt(0).toUpperCase() + league.sport.slice(1);
    let report = `# Fantasy ${sportName} Weekly Report\n\n`;
    report += `## ${league.name} - Week ${week}, ${season} Season\n\n`;
    
    // Weekly Summary
    report += `## 1. Weekly Summary\n\n`;
    report += `**Total Points:** ${weeklyPerformance.totalPoints.toFixed(1)}\n\n`;
    report += `**Result:** ${this.formatResult(weeklyPerformance.result)}\n\n`;
    
    if (weeklyPerformance.topPerformers.length > 0) {
      report += `### Top Performers\n\n`;
      for (const performer of weeklyPerformance.topPerformers) {
        report += `- **${performer.player.name}:** ${performer.points.toFixed(1)} points - ${performer.analysis}\n`;
      }
      report += `\n`;
    }
    
    if (weeklyPerformance.missedOpportunities.length > 0) {
      report += `### Missed Opportunities\n\n`;
      for (const missed of weeklyPerformance.missedOpportunities) {
        report += `- **${missed.player.name}:** ${missed.analysis}\n`;
      }
      report += `\n`;
    }
    
    if (weeklyPerformance.zeroPointPlayers.length > 0) {
      report += `### Zero-Point Players\n\n`;
      for (const zero of weeklyPerformance.zeroPointPlayers) {
        report += `- **${zero.player.name}:** ${zero.reason}\n`;
      }
      report += `\n`;
    }
    
    // Trending Up
    report += `## 2. Trending Up\n\n`;
    if (playerTrends.trendingUp.length > 0) {
      for (const trend of playerTrends.trendingUp) {
        const player = trend.player;
        report += `- **${player.name}:** ${trend.reason}\n`;
      }
    } else {
      report += `No players are significantly trending up at this time.\n`;
    }
    report += `\n`;
    
    // Trending Down
    report += `## 3. Trending Down\n\n`;
    if (playerTrends.trendingDown.length > 0) {
      for (const trend of playerTrends.trendingDown) {
        const player = trend.player;
        report += `- **${player.name}:** ${trend.reason}\n`;
      }
    } else {
      report += `No players are significantly trending down at this time.\n`;
    }
    report += `\n`;
    
    // Waiver Wire Recommendations
    report += `## 4. Waiver Wire Recommendations\n\n`;
    if (waiverRecommendations.length > 0) {
      for (const recommendation of waiverRecommendations) {
        const player = recommendation.player;
        report += `- **${player.name} (${this.formatPriority(recommendation.priority)}):** ${recommendation.reason} Owned in ${recommendation.ownershipPercentage}% of leagues.\n`;
      }
    } else {
      report += `No waiver recommendations available at this time.\n`;
    }
    report += `\n`;
    
    // Final Thoughts
    report += `## 5. Final Thoughts\n\n`;
    report += `This analysis is based on available data and projections. Fantasy sports involve a significant element of luck and unpredictability. Use this information as one of many tools in your decision-making process.\n\n`;
    report += `Good luck in Week ${week + 1}!\n`;
    
    return report;
  }

  /**
   * Format result text
   * @param {string} result - Result string
   * @returns {string} Formatted result
   */
  formatResult(result) {
    if (result === 'win') return '✅ Win';
    if (result === 'loss') return '❌ Loss';
    if (result === 'tie') return '🔄 Tie';
    return '⏳ Pending';
  }

  /**
   * Format priority text
   * @param {string} priority - Priority string
   * @returns {string} Formatted priority
   */
  formatPriority(priority) {
    if (priority === 'high-priority') return '🔥 High Priority';
    if (priority === 'streamer') return '📈 Streamer';
    return '📋 Stash';
  }
}

module.exports = new AnalysisService();
