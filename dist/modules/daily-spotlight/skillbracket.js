exports.getSkillBracket = async (event, context) => {
    try {
        const bracketData = await getSkillBracketStats();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                bracket: bracketData
            })
        };
        
    } catch (error) {
        console.error('Error fetching bracket data:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch bracket data'
            })
        };
    }
};