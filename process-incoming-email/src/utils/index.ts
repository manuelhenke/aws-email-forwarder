import { SESMailCommonHeaders } from 'aws-lambda';
import { ForwardHeaders } from '../interfaces';

export function getHeaders(
  forwardTo: string,
  { returnPath, from = [], to = [], subject, cc = [], bcc = [] }: SESMailCommonHeaders
): ForwardHeaders {
  const mailDelimiter = ', ';
  const headers: ForwardHeaders = {
    To: forwardTo,
    'Reply-To': returnPath,
    'X-Original-From': from.join(mailDelimiter),
    'X-Original-To': to.join(mailDelimiter),
    'X-Original-Cc': '',
    'X-Original-Bcc': '',
    Subject: `Fwd (${returnPath}): ${subject ?? '<Empty Subject>'}`,
  };

  if (cc.length > 0) {
    headers['X-Original-Cc'] = cc.join(mailDelimiter);
  }

  if (bcc.length > 0) {
    headers['X-Original-Bcc'] = bcc.join(mailDelimiter);
  }

  return headers;
}

export function addHeaderField(headers: ForwardHeaders, field: string): ForwardHeaders {
  const [key, value] = field.split(':');
  return {
    ...headers,
    [key.trim()]: value.trim(),
  };
}

export function headersToString(headers: ForwardHeaders): string {
  return Object.entries(headers)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => `${key}: ${value ?? ''}`)
    .join('\r\n');
}
