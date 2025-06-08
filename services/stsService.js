import STS from 'qcloud-cos-sts';

/**
 * 构建符合腾讯云格式的资源路径
 * @param {Object} options - 资源选项
 * @returns {string} - 格式化的资源路径
 */
const buildResourcePath = (options) => {
  const { bucket, region, allowPrefix } = options;
  const prefix = allowPrefix === '*' ? '*' : (allowPrefix.startsWith('/') ? allowPrefix.substring(1) : allowPrefix);

  // 分离 bucket 和 appid
  const bucketParts = bucket.split('-');
  const bucketName = bucketParts[0];
  const appId = bucketParts[1];
  // 构建资源路径格式：qcs::cos:<region>:uid/<appid>:<bucket>/<prefix>
  // 注意: 在资源路径中，应该是 appid + : + 完整bucket名称（包含appid）
  if (prefix === '*') {
    return `qcs::cos:${region}:uid/${appId}:${bucket}/*`;
  } else {
    return `qcs::cos:${region}:uid/${appId}:${bucket}/${prefix}`;
  }
};

/**
 * 获取临时密钥
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} - 临时密钥信息
 */
export const getTemporaryKey = async (options = {}) => {  // 配置参数
  const config = {
    secretId: process.env.TENCENTCLOUD_SECRET_ID,
    secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
    proxy: '',
    host: 'sts.tencentcloudapi.com', // 临时密钥服务域名，默认为 sts.tencentcloudapi.com

    // 放行判断相关参数
    bucket: options.bucket || process.env.TENCENTCLOUD_COS_DEFAULT_BUCKET,
    region: options.region || process.env.TENCENTCLOUD_COS_DEFAULT_REGION,

    // 密钥有效期 - 确保是数字类型
    durationSeconds: parseInt(options.durationSeconds) || 1800,
    // 授予的权限
    allowActions: options.allowActions || [
      // 所有 action 请看文档 https://cloud.tencent.com/document/product/436/31923
      // 简单上传操作
      'cos:PutObject',
      // 分片上传操作
      'cos:InitiateMultipartUpload',
      'cos:ListMultipartUploads',
      'cos:ListParts',
      'cos:UploadPart',
      'cos:CompleteMultipartUpload',
      // 下载操作
      'cos:GetObject',
      // 列出对象操作
      'cos:GetBucket',
    ],

    // 限制的资源前缀
    allowPrefix: options.allowPrefix || '*',
  };
  // 获取临时密钥
  try {
    // 格式化请求资源
    // 确保 allowPrefix 不是以 '/' 开头
    if (config.allowPrefix.startsWith('/')) {
      config.allowPrefix = config.allowPrefix.substring(1);
    }

    // 添加资源格式化逻辑
    const resource = buildResourcePath({
      bucket: config.bucket,
      region: config.region,
      allowPrefix: config.allowPrefix
    });

    // 设置策略资源
    config.policy = {
      version: '2.0',
      statement: [{
        action: config.allowActions,
        effect: 'allow',
        resource: [resource]
      }]
    };
    console.log('STS 请求配置:', {
      ...config,
      secretId: '***', // 隐藏敏感信息
      secretKey: '***', // 隐藏敏感信息
      policy: config.policy, // 显示策略内容
      resource: resource // 显示具体的资源路径
    });

    // 对 bucket 进行格式检查 - 已在 buildResourcePath 中进行了分离
    const bucketParts = config.bucket.split('-');
    if (bucketParts.length !== 2 || isNaN(bucketParts[1])) {
      throw new Error(`Bucket 格式不正确，应为 'bucketname-appid' 格式: ${config.bucket}`);
    }
    try {
      const result = await STS.getCredential(config);
      console.log('临时密钥获取成功:', result);

      return {
        success: true,
        ...result,
        startTime: result.startTime, // 密钥有效期起始时间
        expiredTime: result.expiredTime, // 密钥有效期结束时间
      };
    } catch (stsError) {
      // 处理特定的STS错误
      console.error('STS 错误详情:', {
        message: stsError.message,
        code: stsError.code,
        stack: stsError.stack
      });

      // 策略格式错误
      if (stsError.message && stsError.message.includes('strategy is not json')) {
        throw new Error(`STS策略格式错误: 请检查bucket(${config.bucket})和region(${config.region})配置是否正确`);
      }

      // 资源路径错误
      if (stsError.message && (
        stsError.message.includes('InvalidParameter.ResouceError') ||
        stsError.message.includes('resource error'))
      ) {
        throw new Error(`STS资源路径错误: 资源路径(${resource})格式不正确，请检查bucket和region配置`);
      }

      // 其他错误
      throw stsError;
    }
  } catch (error) {
    console.error('获取临时密钥失败:', error);
    // 提供更详细的错误信息
    const errorMessage = error.message || '未知错误';
    const errorDetails = error.stack || '';
    throw new Error(`获取临时密钥失败: ${errorMessage}\n${errorDetails}`);
  }
};
