/* eslint-disable no-console */
const { SES } = require('aws-sdk');

const { forwardTo } = process.env;

/**
 * @param {CommonHeaders} param0
 * @returns {Object}
 */
function getHeaders({ returnPath, from = [], to = [], subject, cc = [], bcc = [] }) {
  const mailDelimiter = ', ';
  const headers = {
    To: forwardTo,
    'Reply-To': returnPath,
    'X-Original-From': from.join(mailDelimiter),
    'X-Original-To': to.join(mailDelimiter),
    Subject: `Fwd (${returnPath}): ${subject}`,
  };

  if (cc.length) {
    headers['X-Original-Cc'] = cc.join(mailDelimiter);
  }

  if (bcc.length) {
    headers['X-Original-Bcc'] = bcc.join(mailDelimiter);
  }

  return headers;
}

/**
 * @param {Object} headers
 * @param {string} field
 */
function addHeaderField(headers, field) {
  const [key, value] = field.split(':');
  return {
    ...headers,
    [key.trim()]: value.trim(),
  };
}

/**
 * @param {Object} headers
 * @returns {string}
 */
function headersToString(headers) {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');
}

/**
 * @param {SES.RawMessageData} email
 * @returns {Promise<void>}
 */
function sendMail(email) {
  return new Promise((resolve, reject) => {
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
}

/**
 * @typedef ReceiptVerdict
 * @property {('PASS'|'FAIL')} status
 */

/**
 * @typedef CommonHeaders
 * @property {string} returnPath
 * @property {string[]} from
 * @property {string[]} to
 * @property {string[]} [cc]
 * @property {string[]} [bcc]
 * @property {string} date
 * @property {string} messageId
 * @property {string} subject
 */

/**
 * @typedef Message
 * @property {Object} receipt
 * @property {string[]} receipt.recipients
 * @property {ReceiptVerdict} receipt.spamVerdict
 * @property {ReceiptVerdict} receipt.virusVerdict
 * @property {ReceiptVerdict} receipt.spfVerdict
 * @property {ReceiptVerdict} receipt.dkimVerdict
 * @property {ReceiptVerdict} receipt.dmarcVerdict
 * @property {Object} mail
 * @property {CommonHeaders} mail.commonHeaders
 * @property {string} content
 */

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
      .filter((dest) => dest.includes('@henkebyte.com'))
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
