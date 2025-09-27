exports.getCurrentSpotlight = async (event, context) => {
    try {
        const spotlight = await getCurrentSpotlightFromDB();
        
        if (!spotlight) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: 'No spotlight found for today'
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
            body: JSON.stringify({
                success: true,
                spotlight: spotlight,
                skillBracket: await getSkillBracketCount()
            })
        };
        
    } catch (error) {
        console.error('Error fetching current spotlight:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch spotlight data'
            })
        };
    }
};