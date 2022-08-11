const { sendMail } = require('../services/ses-service');
const { getHeaders, addHeaderField, headersToString } = require('../utils');

/* eslint-disable no-console */
const { proxyDomain, forwardTo } = process.env;

exports.handler = (event, context) => {
  console.log('Incoming Request', event.Records[0].Sns.Message);
  const msgInfo = JSON.parse(event.Records[0].Sns.Message);

  /** @type {Message} */
  const {
    receipt: { recipients, spamVerdict, virusVerdict },
    mail: { commonHeaders },
    content,
  } = msgInfo;

  // don't process spam messages
  if (spamVerdict.status === 'FAIL' || virusVerdict.status === 'FAIL') {
    console.warn('Message is spam or contains virus, ignoring.');
    context.succeed();
  }

  let headers = getHeaders(commonHeaders);
  headers.To = forwardTo;

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

  Promise.all(
    recipients
      .filter((dest) => dest.endsWith(proxyDomain))
      .map((dest) => {
        const forwardHeaders = headersToString({
          From: dest,
          ...headers,
        });
        const forwardEmail = `${forwardHeaders}\r\n\r\n${forwardBody}`;
        console.log('forwardEmail', forwardEmail);
        return sendMail(forwardEmail);
      })
  )
    .catch((reason) => {
      console.error(reason);
    })
    .finally(() => {
      context.succeed();
    });
};
