// 在文件顶部添加voiceController导入
import express from 'express';
import multer from 'multer';
import { trainVoice } from '../controllers/voiceController.js';
import voiceController from '../controllers/voiceController.js';

// 在文件顶部添加以下代码
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';


// 确保以下代码只出现一次
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 使用绝对路径并确保目录存在
    const uploadDir = path.join(__dirname, '../uploads/voice/');
    // 确保上传目录存在
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
  }
});

// 限制文件大小为10MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = ['wav', 'mp3', 'ogg', 'm4a', 'aac', 'pcm'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowedTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('不支持的文件类型，仅支持wav、mp3、ogg、m4a、aac、pcm格式'));
  }
});

/**
 * @swagger
 * /api/voice/train:
 *   post:
 *     summary: 提交音频训练音色
 *     tags: [Voice]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *               - speaker_id
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件 (支持wav、mp3、ogg、m4a、aac、pcm格式，最大10MB)
 *               speaker_id:
 *                 type: string
 *                 description: 唯一音色代号
 *               text:
 *                 type: string
 *                 description: 音频对应的文本内容
 *               language:
 *                 type: integer
 *                 default: 0
 *                 description: 语言类型，0-中文，1-英文，2-日语等
 *               model_type:
 *                 type: integer
 *                 default: 0
 *                 description: 模型类型，0-1.0效果，1-2.0效果，2-DiT标准版，3-DiT还原版
 *     responses:
 *       200:
 *         description: 训练请求提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/train', upload.single('audio'), trainVoice);

/**
 * @swagger
 * /api/voice/status:
 *   get:
 *     summary: 查询音色训练状态
 *     description: 查询已购买的音色状态信息，支持按SpeakerIDs和State过滤
 *     tags:
 *       - Voice
 *     parameters:
 *       - name: speakerIDs
 *         in: query
 *         description: SpeakerID列表，多个用逗号分隔
 *         schema: { type: string }
 *       - name: state
 *         in: query
 *         description: 音色状态过滤
 *         schema:
 *           type: string
 *           enum: [Unknown, Training, Success, Active, Expired, Reclaimed]
 *       - name: orderTimeStart
 *         in: query
 *         description: 下单时间检索上边界(毫秒级时间戳)
 *         schema: { type: integer }
 *       - name: orderTimeEnd
 *         in: query
 *         description: 下单时间检索下边界(毫秒级时间戳)
 *         schema: { type: integer }
 *       - name: expireTimeStart
 *         in: query
 *         description: 到期时间检索上边界(毫秒级时间戳)
 *         schema: { type: integer }
 *       - name: expireTimeEnd
 *         in: query
 *         description: 到期时间检索下边界(毫秒级时间戳)
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, description: '状态码' }
 *                 message: { type: string, description: '提示信息' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     Total: { type: integer, description: '总数' }
 *                     SpeakerStatus: 
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           SpeakerID: { type: string, description: '音色ID' }
 *                           State: { type: string, description: '状态' }
 *                           OrderTime: { type: integer, description: '下单时间戳' }
 *                           ExpireTime: { type: integer, description: '到期时间戳' }
 *                           CreateTime: { type: integer, description: '创建时间戳' }
 *       500:
 *         description: 服务器错误
 */
router.get('/status', voiceController.listVoiceStatus);

/**
 * @swagger
 * /api/voice/order:
 *   post:
 *     summary: 音色下单接口
 *     description: 一步下单音色并支付订单，前置条件：AppID已开通声音复刻，账户有足够余额
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - times
 *               - quantity
 *             properties:
 *               times: { type: integer, minimum: 1, description: '单个音色时长(月)' }
 *               quantity: { type: integer, minimum: 1, maximum: 2000, description: '下单音色个数' }
 *               autoUseCoupon: { type: boolean, description: '是否自动使用代金券' }
 *               couponID: { type: string, description: '代金券ID' }
 *               resourceTag: {
 *                 type: object,
 *                 properties: {
 *                   CustomTags: { type: object, additionalProperties: { type: string }, description: '标签' },
 *                   ProjectName: { type: string, description: '项目名称' }
 *                 }
 *               }
 *     responses:
 *       200: { description: '下单成功', content: { application/json: { schema: { type: object } } } }
 *       400: { description: '参数错误' }
 *       500: { description: '服务器错误' }
 */
router.post('/order', voiceController.orderVoiceResource);

/**
 * @swagger
 * /api/voice/renew:
 *   post:
 *     summary: 音色续费接口
 *     description: 一步续费音色并支付订单，前置条件：账户有足够余额，2分钟内最多续费2000个音色
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - times
 *               - speakerIDs
 *             properties:
 *               times: { type: integer, minimum: 1, description: '续费时长(月)' }
 *               speakerIDs: { type: array, items: { type: string }, minItems: 1, maxItems: 2000, description: '要续费的SpeakerID列表' }
 *               autoUseCoupon: { type: boolean, description: '是否自动使用代金券' }
 *               couponID: { type: string, description: '代金券ID' }
 *     responses:
 *       200: { description: '续费成功', content: { application/json: { schema: { type: object } } } }
 *       400: { description: '参数错误' }
 *       500: { description: '服务器错误' }
 */
router.post('/renew', voiceController.renewVoiceResource);

/**
 * @swagger
 * /api/voice/batch-status:
 *   post:
 *     summary: 批量查询音色训练状态
 *     description: 批量查询多个音色的训练状态信息
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - speakerIDs
 *             properties:
 *               speakerIDs:
 *                 type: array
 *                 items: { type: string }
 *                 minItems: 1
 *                 maxItems: 100
 *                 description: 'SpeakerID列表，最多支持100个'
 *               state:
 *                 type: string
 *                 enum: [Unknown, Training, Success, Failed, Active]
 *                 description: '状态过滤'
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, description: '状态码' }
 *                 message: { type: string, description: '提示信息' }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       speaker_id: { type: string, description: '音色ID' }
 *                       status: { type: string, description: '状态' }
 *                       statusCode: { type: integer, description: '状态码' }
 *                       create_time: { type: string, format: date-time, description: '创建时间' }
 *                       version: { type: string, description: '版本' }
 *                       demo_audio: { type: string, description: '演示音频URL' }
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/batch-status', voiceController.batchListMegaTTSTrainStatus);

/**
 * @swagger
 * /api/v1/mega_tts/status:
 *   post:
 *     summary: 查询音色训练状态（火山引擎原生接口）
 *     description: 对接火山引擎 ListMegaTTSTrainStatus API，支持按 SpeakerIDs 和 State 过滤查询
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - AppID
 *             properties:
 *               AppID:
 *                 type: string
 *                 description: 应用 ID
 *               SpeakerIDs:
 *                 type: array
 *                 items: { type: string }
 *                 description: SpeakerID 列表
 *               State:
 *                 type: string
 *                 enum: [Unknown, Training, Success, Active, Expired, Reclaimed]
 *                 description: 音色状态过滤
 *               OrderTimeStart:
 *                 type: integer
 *                 description: 下单时间上边界（毫秒级时间戳）
 *               OrderTimeEnd:
 *                 type: integer
 *                 description: 下单时间下边界（毫秒级时间戳）
 *               ExpireTimeStart:
 *                 type: integer
 *                 description: 到期时间上边界（毫秒级时间戳）
 *               ExpireTimeEnd:
 *                 type: integer
 *                 description: 到期时间下边界（毫秒级时间戳）
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ResponseMetadata:
 *                   type: object
 *                   properties:
 *                     RequestId: { type: string }
 *                     Action: { type: string }
 *                     Version: { type: string }
 *                     Service: { type: string }
 *                     Region: { type: string }
 *                 Result:
 *                   type: object
 *                   properties:
 *                     Statuses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           SpeakerID: { type: string }
 *                           State: { type: string }
 *                           CreateTime: { type: integer }
 *                           ExpireTime: { type: integer }
 *                           OrderTime: { type: integer }
 *                           DemoAudio: { type: string }
 *                           InstanceNO: { type: string }
 *                           IsActivable: { type: boolean }
 *                           Version: { type: string }
 *                           Alias: { type: string }
 *                           AvailableTrainingTimes: { type: integer }
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/v1/mega_tts/status', voiceController.megaTtsStatus);

// 只保留ES模块导出
// module.exports = router;
export default router;