import { SES } from 'aws-sdk';

export function sendMail(email: SES.RawMessage['Data']): Promise<string> {
  return new Promise((resolve, reject) => {
    new SES().sendRawEmail(
      {
        RawMessage: { Data: email },
      },
      (error, data) => {
        if (error) reject(error);
        else {
          console.log(`Sent with MessageId: ${data.MessageId}`);
          resolve(data.MessageId);
        }
      }
    );
  });
}
