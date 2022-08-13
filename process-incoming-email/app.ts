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
  const msgInfo = JSON.parse(event.Records[0].Sns.Message) as SESMessage & { content: string };

  const {
    receipt: { recipients, spamVerdict, virusVerdict },
    mail: { commonHeaders },
    content,
  } = msgInfo;

  // don't process spam messages
  if (spamVerdict.status === 'FAIL' || virusVerdict.status === 'FAIL') {
    console.warn('Message is spam or contains virus, ignoring.');
    return;
  }

  let headers: ForwardHeaders = getHeaders(FORWARD_TO, commonHeaders);

  let forwardBody = 'Empty email';
  if (content) {
    let res;
    res = content.match(/Content-Type:.+\s*boundary.*/);
    if (res) {
      headers = addHeaderField(headers, res[0]);
    } else {
      res = content.match(/^Content-Type:(.*)/m);
      if (res) {
        headers = addHeaderField(headers, res[0]);
      }
    }

    res = content.match(/^Content-Transfer-Encoding:(.*)/m);
    if (res) {
      headers = addHeaderField(headers, res[0]);
    }

    res = content.match(/^MIME-Version:(.*)/m);
    if (res) {
      headers = addHeaderField(headers, res[0]);
    }

    const splitEmail = content.split('\r\n\r\n');
    // remove stale header
    splitEmail.shift();

    forwardBody = splitEmail.join('\r\n\r\n');
  }

  try {
    await Promise.all(
      recipients
        .filter((dest) => dest.endsWith(PROXY_DOMAIN))
        .map((dest) => {
          const forwardHeaders = headersToString({
            From: dest,
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
