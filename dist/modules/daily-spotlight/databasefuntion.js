async function getRecentSubmissions() {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const params = {
        TableName: process.env.SUBMISSIONS_TABLE,
        FilterExpression: 'submittedAt >= :timestamp',
        ExpressionAttributeValues: {
            ':timestamp': twentyFourHoursAgo.toISOString()
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

/**
 * Deterministic winner selection
 */
function selectWinner(submissions) {
    // Sort by score (desc), then by earliest time (asc)
    submissions.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
    
    return submissions[0];
}

/**
 * Save spotlight winner to database
 */
async function saveSpotlightWinner(winner) {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const spotlightRecord = {
        id: `spotlight-${new Date().toISOString().split('T')[0]}`,
        date: new Date().toISOString().split('T')[0],
        winnerId: winner.id,
        winnerName: winner.author,
        submissionTitle: winner.title,
        score: winner.score,
        selectedAt: new Date().toISOString(),
        emailSent: false,
        creditsAwarded: 100
    };
    
    const params = {
        TableName: process.env.SPOTLIGHTS_TABLE,
        Item: spotlightRecord
    };
    
    await dynamodb.put(params).promise();
    return spotlightRecord;
}

/**
 * Get current spotlight from database
 */
async function getCurrentSpotlightFromDB() {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const params = {
        TableName: process.env.SPOTLIGHTS_TABLE,
        Key: { id: `spotlight-${currentDate}` }
    };
    
    const result = await dynamodb.get(params).promise();
    return result.Item;
}

/**
 * Get submission by ID
 */
async function getSubmissionById(submissionId) {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const params = {
        TableName: process.env.SUBMISSIONS_TABLE,
        Key: { id: submissionId }
    };
    
    const result = await dynamodb.get(params).promise();
    return result.Item;
}