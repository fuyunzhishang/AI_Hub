import { getTemporaryKey } from '../services/stsService.js';

/**
 * 获取腾讯云COS临时密钥
 */
export const getSTSKey = async (req, res) => {
  try {    // 从请求体中获取参数
    const {
      bucket = process.env.TENCENTCLOUD_COS_DEFAULT_BUCKET,  // 从环境变量中获取默认值
      region = process.env.TENCENTCLOUD_COS_DEFAULT_REGION, // 从环境变量中获取默认区域
      allowPrefix = '*',  // 资源前缀，* 表示所有资源
    } = req.body;

    // 验证 bucket 格式（bucketName-appId）
    const bucketParts = bucket.split('-');
    if (bucketParts.length !== 2 || isNaN(bucketParts[1])) {
      return res.status(400).json({
        success: false,
        error: '桶名格式错误',
        details: `Bucket 格式应为 'bucketName-appId'，当前值: ${bucket}`
      });
    }

    // 确保 durationSeconds 是数字类型
    const durationSeconds = parseInt(req.body.durationSeconds) || 1800;

    // 根据业务场景设置不同的权限
    let allowActions = [];
    const actionType = req.body.actionType || 'default';

    switch (actionType) {
      case 'upload':
        // 仅上传权限
        allowActions = [
          'cos:PutObject',
          'cos:InitiateMultipartUpload',
          'cos:ListMultipartUploads',
          'cos:ListParts',
          'cos:UploadPart',
          'cos:CompleteMultipartUpload',
        ];
        break;
      case 'download':
        // 仅下载权限
        allowActions = [
          'cos:GetObject',
        ];
        break;
      case 'read':
        // 仅读取权限
        allowActions = [
          'cos:GetObject',
          'cos:GetBucket',
          'cos:HeadObject',
        ];
        break;
      default:
        // 默认权限，包含上传和下载
        allowActions = [
          'cos:PutObject',
          'cos:GetObject',
          'cos:InitiateMultipartUpload',
          'cos:ListMultipartUploads',
          'cos:ListParts',
          'cos:UploadPart',
          'cos:CompleteMultipartUpload',
          'cos:GetBucket',
        ];
    }    // 获取临时密钥
    const result = await getTemporaryKey({
      bucket,
      region,
      allowActions,
      allowPrefix,
      durationSeconds,
    });

    // 返回临时密钥信息
    return res.status(200).json({
      success: true,
      message: '获取临时密钥成功',
      data: result,
    });
  } catch (error) {
    console.error('临时密钥获取错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取临时密钥失败',
      details: error.message,
    });
  }
};
