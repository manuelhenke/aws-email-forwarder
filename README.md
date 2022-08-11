# aws-email-forwarder

Lambda function to forward incoming mails from a SNS Topic to another email address. The index.js is ready to go to run in Lambda.

## Prerequisite

You'll have to add the to environment variables stated in [.env.example](/.env.example) to the Lambda environment. Also AWS SES has to be set up to send mails for your domain and receive them to a SNS Topic.
