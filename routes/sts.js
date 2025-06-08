import express from 'express';
import { getSTSKey } from '../controllers/stsController.js';

const router = express.Router();

// 获取临时密钥路由
router.post('/get-credential', getSTSKey);

export default router;
