import COS from 'cos-nodejs-sdk-v5';
import path from 'path';
import fs from 'fs';
import { getValidTencentCloudCredentials } from '../utils/credentialManager.js';

/**
 * 上传文件到腾讯云COS
 * @param {string} filePath - 本地文件路径
 * @param {string} fileName - 文件名
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} - 上传结果
 */
export const uploadToCOS = async (filePath, fileName, options = {}) => {
    try {
        // 获取有效的腾讯云密钥
        const credentials = await getValidTencentCloudCredentials();

        // 实例化 COS 对象
        const cos = new COS({
            SecretId: credentials.secretId,
            SecretKey: credentials.secretKey,
        });

        const bucket = options.bucket || process.env.TENCENTCLOUD_COS_DEFAULT_BUCKET;
        const region = options.region || process.env.TENCENTCLOUD_COS_DEFAULT_REGION;
        const key = options.key || `speech/${Date.now()}-${fileName}`;

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        // 获取文件信息
        const stats = fs.statSync(filePath);
        console.log(`准备上传文件到COS: ${fileName}, 大小: ${stats.size} 字节`);// 上传文件，设置为公共读取权限
        return new Promise((resolve, reject) => {
            cos.putObject({
                Bucket: bucket,
                Region: region,
                Key: key,
                Body: fs.createReadStream(filePath),
                ContentLength: stats.size,
                ACL: 'public-read', // 设置为公共读取权限，让腾讯云语音识别服务可以访问
                onProgress: function (progressData) {
                    console.log('COS上传进度:', Math.round(progressData.percent * 100) + '%');
                }
            }, function (err, data) {
                if (err) {
                    console.error('COS上传失败:', err);
                    reject(new Error(`COS上传失败: ${err.message}`));
                } else {
                    console.log('COS上传成功:', data);

                    // 构建文件的公网访问URL
                    const fileUrl = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;

                    resolve({
                        success: true,
                        bucket: bucket,
                        region: region,
                        key: key,
                        etag: data.ETag,
                        location: data.Location,
                        url: fileUrl,
                        size: stats.size
                    });
                }
            });
        });
    } catch (error) {
        console.error('COS上传错误:', error);
        throw new Error(`COS上传失败: ${error.message}`);
    }
};

/**
 * 删除COS上的文件
 * @param {string} key - 文件键
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} - 删除结果
 */
export const deleteFromCOS = async (key, options = {}) => {
    try {
        // 获取有效的腾讯云密钥
        const credentials = await getValidTencentCloudCredentials();

        const cos = new COS({
            SecretId: credentials.secretId,
            SecretKey: credentials.secretKey,
        });

        const bucket = options.bucket || process.env.TENCENTCLOUD_COS_DEFAULT_BUCKET;
        const region = options.region || process.env.TENCENTCLOUD_COS_DEFAULT_REGION;

        return new Promise((resolve, reject) => {
            cos.deleteObject({
                Bucket: bucket,
                Region: region,
                Key: key
            }, function (err, data) {
                if (err) {
                    console.error('COS删除失败:', err);
                    reject(new Error(`COS删除失败: ${err.message}`));
                } else {
                    console.log('COS删除成功:', data);
                    resolve({
                        success: true,
                        key: key
                    });
                }
            });
        });
    } catch (error) {
        console.error('COS删除错误:', error);
        throw new Error(`COS删除失败: ${error.message}`);
    }
};

/**
 * 生成COS文件的预签名URL
 * @param {string} key - 文件键
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} - 预签名URL
 */
export const getSignedUrl = async (key, options = {}) => {
    try {
        // 获取有效的腾讯云密钥
        const credentials = await getValidTencentCloudCredentials();

        const cos = new COS({
            SecretId: credentials.secretId,
            SecretKey: credentials.secretKey,
        });

        const bucket = options.bucket || process.env.TENCENTCLOUD_COS_DEFAULT_BUCKET;
        const region = options.region || process.env.TENCENTCLOUD_COS_DEFAULT_REGION;
        const expires = options.expires || 3600; // 默认1小时有效期

        return new Promise((resolve, reject) => {
            cos.getObjectUrl({
                Bucket: bucket,
                Region: region,
                Key: key,
                Sign: true,
                Expires: expires
            }, function (err, data) {
                if (err) {
                    console.error('生成预签名URL失败:', err);
                    reject(new Error(`生成预签名URL失败: ${err.message}`));
                } else {
                    console.log('预签名URL生成成功:', data.Url);
                    resolve(data.Url);
                }
            });
        });
    } catch (error) {
        console.error('预签名URL生成错误:', error);
        throw new Error(`预签名URL生成失败: ${error.message}`);
    }
};

/**
 * 验证URL是否可访问
 * @param {string} url - 要验证的URL
 * @returns {Promise<Object>} - 验证结果
 */
export const validateUrl = async (url) => {
    try {
        console.log(`验证URL可访问性: ${url}`);

        // 使用node-fetch进行URL验证
        const response = await fetch(url, {
            method: 'HEAD',
            timeout: 10000, // 10秒超时
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI_Hub/1.0)' // 添加用户代理
            }
        });

        console.log(`URL验证结果: 状态码=${response.status}, 可访问=${response.ok}`);

        if (response.ok) {
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');

            return {
                accessible: true,
                status: response.status,
                contentLength: contentLength,
                contentType: contentType,
                url: url
            };
        } else {
            return {
                accessible: false,
                status: response.status,
                error: `HTTP ${response.status} ${response.statusText}`,
                url: url
            };
        }
    } catch (error) {
        console.error('URL验证失败:', error);
        return {
            accessible: false,
            error: error.message,
            url: url
        };
    }
};
