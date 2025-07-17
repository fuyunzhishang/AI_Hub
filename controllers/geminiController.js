import geminiService from '../services/geminiService.js'

export const generateText = async (req, res) => {
  try {
    const { model, ...params } = req.body

    if (model) {
      geminiService.updateModel(model)
    }

    const result = await geminiService.generateContent(params)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Generate text error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const generateTextStream = async (req, res) => {
  try {
    const { model, ...params } = req.body

    if (model) {
      geminiService.updateModel(model)
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = await geminiService.generateContentStream(params)

    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${line}\n\n`)
        }
      }
    })

    stream.on('end', () => {
      res.write(`data: [DONE]\n\n`)
      res.end()
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    })
  } catch (error) {
    console.error('Generate text stream error:', error)
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
}

export const getModels = async (req, res) => {
  try {
    const models = geminiService.getAvailableModels()
    res.json({
      success: true,
      data: models
    })
  } catch (error) {
    console.error('Get models error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getStatus = async (req, res) => {
  try {
    const isConfigured = geminiService.isConfigured()
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        message: isConfigured 
          ? 'Gemini API is properly configured' 
          : 'Google API key not configured. Please set GOOGLE_API_KEY environment variable.'
      }
    })
  } catch (error) {
    console.error('Get status error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}