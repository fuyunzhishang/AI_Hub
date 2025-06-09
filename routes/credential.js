import express from 'express';
import {
    checkCredentialStatus,
    validateCredentials,
    updateCredentials
} from '../controllers/credentialController.js';

const router = express.Router();

// 检查密钥状态
router.get('/status', checkCredentialStatus);

// 验证密钥
router.post('/validate', validateCredentials);

// 更新密钥配置
router.post('/update', updateCredentials);

export default router;
