exports.selectDailySpotlight = async (event, context) => {
    try {
        console.log('Starting daily spotlight selection...');
        
        // Get submissions from last 24 hours
        const submissions = await getRecentSubmissions();
        
        if (submissions.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    message: 'No submissions found in last 24 hours',
                    winner: null
                })
            };
        }
        
        // Deterministic selection: highest score → earliest time
        const winner = selectWinner(submissions);
        
        // Save spotlight winner to database
        await saveSpotlightWinner(winner);
        
        // Send notification email
        await sendWinnerNotification(winner);
        
        // Update skill bracket counter
        await incrementSkillBracket();
        
        // Log for monitoring
        console.log(`Spotlight winner selected: ${winner.title} by ${winner.author} (Score: ${winner.score})`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                winner: winner,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error selecting spotlight winner:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};