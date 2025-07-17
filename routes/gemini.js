import express from 'express'
import { 
  generateText, 
  generateTextStream, 
  getModels, 
  getStatus 
} from '../controllers/geminiController.js'

const router = express.Router()

/**
 * @swagger
 * /api/gemini/generate:
 *   post:
 *     summary: Generate text using Gemini API (transparent proxy)
 *     tags: [Gemini]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 default: gemini-2.5-flash
 *                 description: The model to use (optional, will update the endpoint URL)
 *               contents:
 *                 type: array
 *                 description: The conversation history following Gemini API format
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     parts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *               generationConfig:
 *                 type: object
 *                 description: Configuration for generation
 *                 properties:
 *                   temperature:
 *                     type: number
 *                   topK:
 *                     type: integer
 *                   topP:
 *                     type: number
 *                   maxOutputTokens:
 *                     type: integer
 *                   stopSequences:
 *                     type: array
 *                     items:
 *                       type: string
 *               safetySettings:
 *                 type: array
 *                 description: Safety settings
 *                 items:
 *                   type: object
 *           examples:
 *             simple:
 *               value:
 *                 contents:
 *                   - role: user
 *                     parts:
 *                       - text: "Write a story about a magic backpack"
 *                 generationConfig:
 *                   temperature: 0.7
 *                   maxOutputTokens: 1024
 *     responses:
 *       200:
 *         description: Successfully generated text (Gemini API response format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Direct response from Gemini API
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/generate', generateText)

/**
 * @swagger
 * /api/gemini/generate-stream:
 *   post:
 *     summary: Generate text using Gemini API with streaming response (transparent proxy)
 *     tags: [Gemini]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 default: gemini-2.5-flash
 *                 description: The model to use (optional, will update the endpoint URL)
 *               contents:
 *                 type: array
 *                 description: The conversation history following Gemini API format
 *               generationConfig:
 *                 type: object
 *                 description: Configuration for generation
 *               safetySettings:
 *                 type: array
 *                 description: Safety settings
 *     responses:
 *       200:
 *         description: Server-sent events stream (proxied from Gemini API)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/generate-stream', generateTextStream)

/**
 * @swagger
 * /api/gemini/models:
 *   get:
 *     summary: Get available Gemini models
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/models', getModels)

/**
 * @swagger
 * /api/gemini/status:
 *   get:
 *     summary: Check Gemini API configuration status
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: API configuration status
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
 *                     configured:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.get('/status', getStatus)

export default router