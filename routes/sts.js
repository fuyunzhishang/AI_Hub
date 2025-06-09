import express from 'express';
import { getSTSKey } from '../controllers/stsController.js';

const router = express.Router();

/**
 * @swagger
 * /api/sts/get-credential:
 *   post:
 *     summary: 获取腾讯云临时密钥
 *     tags: [腾讯云 STS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *                 description: COS 存储桶名称
 *                 example: example-1250000000
 *               region:
 *                 type: string
 *                 description: COS 存储桶所在地域
 *                 example: ap-guangzhou
 *               actionType:
 *                 type: string
 *                 enum: [default, upload, download, read]
 *                 default: default
 *                 description: |
 *                   权限类型:
 *                   - default: 默认权限（读写）
 *                   - upload: 仅上传权限
 *                   - download: 仅下载权限
 *                   - read: 只读权限
 *               allowPrefix:
 *                 type: string
 *                 default: '*'
 *                 description: 资源前缀，支持通配符
 *               durationSeconds:
 *                 type: integer
 *                 default: 1800
 *                 minimum: 900
 *                 maximum: 7200
 *                 description: 临时密钥有效期（秒）
 *             required:
 *               - bucket
 *               - region
 *     responses:
 *       200:
 *         description: 成功获取临时密钥
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tmpSecretId:
 *                       type: string
 *                       description: 临时密钥 ID
 *                     tmpSecretKey:
 *                       type: string
 *                       description: 临时密钥 Key
 *                     sessionToken:
 *                       type: string
 *                       description: 临时密钥 Token
 *                     startTime:
 *                       type: integer
 *                       description: 密钥生效时间（时间戳）
 *                     expiredTime:
 *                       type: integer
 *                       description: 密钥过期时间（时间戳）
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/get-credential', getSTSKey);

export default router;
