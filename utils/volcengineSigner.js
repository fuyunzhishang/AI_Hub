// 将第1-2行的 require 改为 import
import crypto from 'crypto';
import moment from 'moment';

class VolcengineSigner {
  constructor(accessKey, secretKey) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.service = 'speech_saas_prod';
    this.region = 'cn-north-1';
    this.version = '2023-11-07';
  }

  /**
   * 生成API请求签名
   * @param {string} action - API操作名称
   * @param {object} body - 请求体
   * @returns {object} - 签名后的请求头和URL
   */
  sign(action, body) {
    const timestamp = moment().utc().format('YYYYMMDDTHHmmssZ');
    const nonce = crypto.randomUUID();
    const bodyStr = JSON.stringify(body);
    const contentHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

    // 构造规范请求串
    const canonicalRequest = [
      'POST',
      '/',
      '',
      `content-type:application/json; charset=utf-8`,
      `host:open.volcengineapi.com`,
      `x-content-sha256:${contentHash}`,
      `x-date:${timestamp}`,
      `x-nonce:${nonce}`,
      '',
      'content-type;host;x-content-sha256;x-date;x-nonce',
      contentHash
    ].join('\n');

    // 构造签名串
    const credentialScope = `${moment().format('YYYYMMDD')}/${this.region}/${this.service}/request`;
    const stringToSign = [
      'HMAC-SHA256',
      timestamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // 计算签名
    const signingKey = this.getSigningKey(this.secretKey, moment().format('YYYYMMDD'), this.region, this.service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    // 构造Authorization头
    const authorization = `HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=content-type;host;x-content-sha256;x-date;x-nonce, Signature=${signature}`;

    return {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Date': timestamp,
        'X-Nonce': nonce,
        'X-Content-Sha256': contentHash,
        'Authorization': authorization
      },
      url: `https://open.volcengineapi.com/?Action=${action}&Version=${this.version}`
    };
  }

  /**
   * 生成签名密钥
   */
  getSigningKey(secretKey, date, region, service) {
    const kDate = crypto.createHmac('sha256', `VOLC${secretKey}`).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    return crypto.createHmac('sha256', kService).update('request').digest();
  }
}

// 将最后一行的 module.exports 改为 export default
export default VolcengineSigner;