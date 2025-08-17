exports.sendNotification = async (event, context) => {
    try {
        const { winnerId, testMode = false } = JSON.parse(event.body || '{}');
        
        let winner;
        if (testMode) {
            winner = await getCurrentSpotlightFromDB();
        } else {
            winner = await getSubmissionById(winnerId);
        }
        
        if (!winner) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: 'Winner not found'
                })
            };
        }
        
        const emailResult = await sendWinnerNotification(winner);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: testMode ? 'Test email sent successfully' : 'Notification sent',
                emailId: emailResult.messageId
            })
        };
        
    } catch (error) {
        console.error('Error sending notification:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Failed to send notification'
            })
        };
    }
};