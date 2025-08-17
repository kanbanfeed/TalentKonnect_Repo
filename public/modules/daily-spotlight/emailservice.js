async function sendWinnerNotification(winner) {
    const AWS = require('aws-sdk');
    const ses = new AWS.SES();
    
    const emailTemplate = generateEmailTemplate(winner);
    
    const params = {
        Source: process.env.FROM_EMAIL,
        Destination: {
            ToAddresses: [winner.authorEmail || `${winner.author.toLowerCase().replace(' ', '.')}@example.com`]
        },
        Message: {
            Subject: {
                Data: "🏆 You're Today's Daily Spotlight Winner!",
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: emailTemplate,
                    Charset: 'UTF-8'
                },
                Text: {
                    Data: generateTextEmail(winner),
                    Charset: 'UTF-8'
                }
            }
        }
    };
    
    const result = await ses.sendEmail(params).promise();
    
    // Mark email as sent in database
    await markEmailSent(winner.id);
    
    return result;
}