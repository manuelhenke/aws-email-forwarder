/**
 * @param {CommonHeaders} param0
 * @returns {Object}
 */
exports.getHeaders = ({ returnPath, from = [], to = [], subject, cc = [], bcc = [] }) => {
  const mailDelimiter = ', ';
  const headers = {
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
};

/**
 * @param {Object} headers
 * @param {string} field
 */
exports.addHeaderField = (headers, field) => {
  const [key, value] = field.split(':');
  return {
    ...headers,
    [key.trim()]: value.trim(),
  };
};

/**
 * @param {Object} headers
 * @returns {string}
 */
exports.headersToString = (headers) =>
  Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');
