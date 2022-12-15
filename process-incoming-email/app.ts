import { SNSEvent, SESMessage, Handler } from 'aws-lambda';
import { cleanEnv, email, host } from 'envalid';
import { ForwardHeaders } from './src/interfaces';
import { sendMail } from './src/services/ses-service';
import { getHeaders, addHeaderField, headersToString } from './src/utils';

const { PROXY_DOMAIN, FORWARD_TO } = cleanEnv(process.env, {
  PROXY_DOMAIN: host(),
  FORWARD_TO: email(),
});

export const handler: Handler<SNSEvent, void> = async (event) => {
  console.log('Incoming Request', event.Records[0].Sns.Message);
  const messageInfo = JSON.parse(event.Records[0].Sns.Message) as SESMessage & { content: string };

  const {
    receipt: { recipients, spamVerdict, virusVerdict },
    mail: { commonHeaders },
    content,
  } = messageInfo;

  // don't process spam messages
  if (spamVerdict.status === 'FAIL' || virusVerdict.status === 'FAIL') {
    console.warn('Message is spam or contains virus, ignoring.');
    return;
  }

  let headers: ForwardHeaders = getHeaders(FORWARD_TO, commonHeaders);

  let forwardBody = 'Empty email';
  if (content) {
    let matches;
    matches = content.match(/Content-Type:.+\s*boundary.*/);
    if (matches) {
      headers = addHeaderField(headers, matches[0]);
    } else {
      matches = content.match(/^Content-Type:(.*)/m);
      if (matches) {
        headers = addHeaderField(headers, matches[0]);
      }
    }

    matches = content.match(/^Content-Transfer-Encoding:(.*)/m);
    if (matches) {
      headers = addHeaderField(headers, matches[0]);
    }

    matches = content.match(/^MIME-Version:(.*)/m);
    if (matches) {
      headers = addHeaderField(headers, matches[0]);
    }

    const splitEmail = content.split('\r\n\r\n');
    // remove stale header
    splitEmail.shift();

    forwardBody = splitEmail.join('\r\n\r\n').replace(/"/g, '\\"');
  }

  try {
    await Promise.all(
      recipients
        .filter((destination) => destination.endsWith(PROXY_DOMAIN))
        .map((destination) => {
          const forwardHeaders = headersToString({
            From: destination,
            ...headers,
          });
          const forwardEmail = `${forwardHeaders}\r\n\r\n${forwardBody}`;
          console.log('forwardEmail', forwardEmail);
          return sendMail(forwardEmail);
        })
    );
  } catch (error) {
    console.error(error);
  }
};
