import CryptoJS from 'crypto-js';

/**
 * AES解密函数
 * 与Java版本等效实现
 * 
 * @param {string} text 要解密的十六进制字符串
 * @param {string} secretKeyStr 密钥
 * @returns {string} 解密后的字符串
 */
export function decryptAes(text, secretKeyStr) {
  if (!text || !secretKeyStr) {
    return '';
  }
  
  try {
    // 创建密钥
    const keyBytes = CryptoJS.enc.Utf8.parse(secretKeyStr);
    
    // 创建IV (与Java版使用相同的IV)
    const iv = CryptoJS.enc.Utf8.parse(secretKeyStr);
    
    // 将十六进制字符串转换为字节数组
    const ciphertext = CryptoJS.enc.Hex.parse(text);
    
    // 解密
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      keyBytes,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    // 转换为UTF-8字符串
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('AES解密失败:', e);
    return '';
  }
}