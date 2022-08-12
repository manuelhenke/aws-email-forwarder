export interface ForwardHeaders {
  [key: string]: string;
  To: string;
  'Reply-To': string;
  'X-Original-From': string;
  'X-Original-To': string;
  'X-Original-Cc': string;
  'X-Original-Bcc': string;
  Subject: string;
}
