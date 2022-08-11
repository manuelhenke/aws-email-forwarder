/* eslint-disable no-console */
const { SES } = require('aws-sdk');

/**
 * @param {SES.RawMessageData} email
 * @returns {Promise<void>}
 */
exports.sendMail = (email) =>
  new Promise((resolve, reject) => {
    new SES().sendRawEmail(
      {
        RawMessage: { Data: email },
      },
      (err, data) => {
        if (err) reject(err);
        else {
          console.log(`Sent with MessageId: ${data.MessageId}`);
          resolve(data.MessageId);
        }
      }
    );
  });
