import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 凭证管理器 - 处理腾讯云密钥过期问题
 */
export class CredentialManager {
    constructor() {
        this.credentials = {
            secretId: process.env.TENCENTCLOUD_SECRET_ID,
            secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
            lastVerified: null,
            isValid: false
        };
    }

    /**
     * 验证密钥是否有效
     * @returns {Promise<boolean>} - 验证结果
     */
    async validateCredentials() {
        try {
            if (!this.credentials.secretId || !this.credentials.secretKey) {
                console.error('腾讯云密钥未配置');
                return false;
            }

            // 使用简单的COS接口验证密钥
            const COS = (await import('cos-nodejs-sdk-v5')).default;
            const cos = new COS({
                SecretId: this.credentials.secretId,
                SecretKey: this.credentials.secretKey,
            });

            // 尝试获取bucket列表来验证密钥
            await new Promise((resolve, reject) => {
                cos.getService({}, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });

            this.credentials.isValid = true;
            this.credentials.lastVerified = new Date();
            console.log('腾讯云密钥验证成功');
            return true;

        } catch (error) {
            this.credentials.isValid = false;
            console.error('腾讯云密钥验证失败:', error.message);

            // 检查具体的错误类型
            if (error.message.includes('SignatureDoesNotMatch')) {
                console.error('❌ 密钥签名不匹配，请检查 SecretId 和 SecretKey 是否正确');
            } else if (error.message.includes('InvalidAccessKeyId')) {
                console.error('❌ SecretId 无效或已过期');
            } else if (error.message.includes('TokenExpired')) {
                console.error('❌ 临时密钥已过期，请重新获取');
            } else {
                console.error('❌ 密钥验证失败，可能的原因：');
                console.error('  1. 密钥已过期');
                console.error('  2. 密钥权限不足');
                console.error('  3. 网络连接问题');
            }
            return false;
        }
    }

    /**
     * 获取有效的密钥
     * @returns {Promise<Object>} - 密钥对象
     */
    async getValidCredentials() {
        // 如果距离上次验证超过30分钟，重新验证
        const thirtyMinutes = 30 * 60 * 1000;
        const needValidation = !this.credentials.lastVerified ||
            (Date.now() - this.credentials.lastVerified.getTime() > thirtyMinutes);

        if (needValidation || !this.credentials.isValid) {
            const isValid = await this.validateCredentials();
            if (!isValid) {
                throw new Error('腾讯云密钥验证失败，请检查配置');
            }
        }

        return {
            secretId: this.credentials.secretId,
            secretKey: this.credentials.secretKey
        };
    }

    /**
     * 刷新环境变量中的密钥
     * @param {string} newSecretId - 新的SecretId
     * @param {string} newSecretKey - 新的SecretKey
     */
    updateCredentials(newSecretId, newSecretKey) {
        this.credentials.secretId = newSecretId;
        this.credentials.secretKey = newSecretKey;
        this.credentials.isValid = false;
        this.credentials.lastVerified = null;

        console.log('密钥已更新，请重新验证');
    }

    /**
     * 获取密钥状态信息
     * @returns {Object} - 状态信息
     */
    getStatus() {
        return {
            hasCredentials: !!(this.credentials.secretId && this.credentials.secretKey),
            isValid: this.credentials.isValid,
            lastVerified: this.credentials.lastVerified,
            secretIdMasked: this.credentials.secretId ?
                this.credentials.secretId.substring(0, 6) + '***' : 'Not Set'
        };
    }
}

// 创建全局实例
export const credentialManager = new CredentialManager();

/**
 * 验证并获取腾讯云密钥的辅助函数
 * @returns {Promise<Object>} - 验证后的密钥
 */
export const getValidTencentCloudCredentials = async () => {
    return await credentialManager.getValidCredentials();
};

/**
 * 检查密钥配置的辅助函数
 * @returns {Object} - 配置检查结果
 */
export const checkCredentialConfiguration = () => {
    const status = credentialManager.getStatus();

    if (!status.hasCredentials) {
        return {
            valid: false,
            message: '腾讯云密钥未配置',
            suggestions: [
                '1. 检查 .env 文件是否存在',
                '2. 确认 TENCENTCLOUD_SECRET_ID 和 TENCENTCLOUD_SECRET_KEY 已设置',
                '3. 重启应用程序以加载新的环境变量'
            ]
        };
    }

    return {
        valid: true,
        message: '密钥配置正常',
        status: status
    };
};
