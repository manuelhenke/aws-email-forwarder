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
