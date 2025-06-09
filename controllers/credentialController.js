import {
    credentialManager,
    checkCredentialConfiguration,
    getValidTencentCloudCredentials
} from '../utils/credentialManager.js';

/**
 * 检查腾讯云密钥状态
 */
export const checkCredentialStatus = async (req, res) => {
    try {
        const configCheck = checkCredentialConfiguration();

        if (!configCheck.valid) {
            return res.status(400).json({
                success: false,
                error: '密钥配置错误',
                message: configCheck.message,
                suggestions: configCheck.suggestions
            });
        }

        // 验证密钥有效性
        const isValid = await credentialManager.validateCredentials();
        const status = credentialManager.getStatus();

        return res.status(200).json({
            success: true,
            message: isValid ? '密钥验证成功' : '密钥验证失败',
            status: {
                hasCredentials: status.hasCredentials,
                isValid: status.isValid,
                lastVerified: status.lastVerified,
                secretIdMasked: status.secretIdMasked,
                needsUpdate: !isValid
            },
            recommendations: !isValid ? [
                '1. 检查 .env 文件中的密钥是否正确',
                '2. 确认密钥是否已过期',
                '3. 验证密钥权限是否足够',
                '4. 检查网络连接是否正常'
            ] : null
        });

    } catch (error) {
        console.error('密钥状态检查失败:', error);
        return res.status(500).json({
            success: false,
            error: '密钥状态检查失败',
            details: error.message
        });
    }
};

/**
 * 手动验证密钥
 */
export const validateCredentials = async (req, res) => {
    try {
        // 强制重新验证密钥
        credentialManager.credentials.isValid = false;
        credentialManager.credentials.lastVerified = null;

        const credentials = await getValidTencentCloudCredentials();
        const status = credentialManager.getStatus();

        return res.status(200).json({
            success: true,
            message: '密钥验证成功，可以正常使用腾讯云服务',
            status: {
                isValid: status.isValid,
                lastVerified: status.lastVerified,
                secretIdMasked: status.secretIdMasked
            }
        });

    } catch (error) {
        console.error('密钥验证失败:', error);

        let errorMessage = '密钥验证失败';
        let suggestions = [
            '1. 检查 TENCENTCLOUD_SECRET_ID 是否正确',
            '2. 检查 TENCENTCLOUD_SECRET_KEY 是否正确',
            '3. 确认密钥是否已过期',
            '4. 验证账户权限是否足够'
        ];

        // 根据错误类型提供具体建议
        if (error.message.includes('SignatureDoesNotMatch')) {
            errorMessage = '密钥签名验证失败';
            suggestions = [
                '1. 检查 SecretKey 是否正确输入',
                '2. 确认没有多余的空格或特殊字符',
                '3. 重新从腾讯云控制台复制密钥'
            ];
        } else if (error.message.includes('InvalidAccessKeyId')) {
            errorMessage = 'SecretId 无效';
            suggestions = [
                '1. 检查 SecretId 是否正确输入',
                '2. 确认密钥是否已被删除',
                '3. 联系管理员确认密钥状态'
            ];
        } else if (error.message.includes('TokenExpired')) {
            errorMessage = '密钥已过期';
            suggestions = [
                '1. 重新生成新的访问密钥',
                '2. 更新 .env 文件中的密钥配置',
                '3. 重启应用程序'
            ];
        }

        return res.status(400).json({
            success: false,
            error: errorMessage,
            details: error.message,
            suggestions: suggestions,
            troubleshooting: {
                envFileLocation: 'd:\\gitee\\AI_Hub\\.env',
                requiredVariables: [
                    'TENCENTCLOUD_SECRET_ID',
                    'TENCENTCLOUD_SECRET_KEY'
                ],
                helpUrl: 'https://cloud.tencent.com/document/product/598/37140'
            }
        });
    }
};

/**
 * 更新密钥配置
 */
export const updateCredentials = async (req, res) => {
    try {
        const { secretId, secretKey } = req.body;

        if (!secretId || !secretKey) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数',
                message: '请提供 secretId 和 secretKey'
            });
        }

        // 更新密钥
        credentialManager.updateCredentials(secretId, secretKey);

        // 验证新密钥
        const isValid = await credentialManager.validateCredentials();

        if (isValid) {
            return res.status(200).json({
                success: true,
                message: '密钥更新并验证成功',
                status: credentialManager.getStatus()
            });
        } else {
            return res.status(400).json({
                success: false,
                error: '新密钥验证失败',
                message: '请检查提供的密钥是否正确'
            });
        }

    } catch (error) {
        console.error('更新密钥失败:', error);
        return res.status(500).json({
            success: false,
            error: '更新密钥失败',
            details: error.message
        });
    }
};
