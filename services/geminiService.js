import axios from 'axios'

class GeminiService {
  constructor() {
    this.geminiHost = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  }

  getApiKey() {
    if (!this.apiKey) {
      this.apiKey = process.env.GOOGLE_API_KEY
      if (!this.apiKey) {
        console.warn('GOOGLE_API_KEY not found in environment variables')
      }
    }
    return this.apiKey
  }

  async generateContent(params) {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable.')
    }

    try {
      const response = await axios({
        url: this.geminiHost,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        method: 'post',
        data: params
      })

      return response.data
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message)
      
      if (error.response?.status === 401) {
        throw new Error('Invalid API key')
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded')
      } else if (error.response?.status === 400) {
        throw new Error(`Bad request: ${error.response?.data?.error?.message || 'Invalid parameters'}`)
      }
      
      throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async generateContentStream(params) {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable.')
    }

    const streamUrl = this.geminiHost.replace(':generateContent', ':streamGenerateContent')

    try {
      const response = await axios({
        url: streamUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        method: 'post',
        data: params,
        responseType: 'stream'
      })

      return response.data
    } catch (error) {
      console.error('Gemini Stream API error:', error.response?.data || error.message)
      throw new Error(`Gemini Stream API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  updateModel(model) {
    this.geminiHost = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  }

  getAvailableModels() {
    return [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient model for general tasks'
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Most capable model for complex tasks'
      },
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental model with enhanced capabilities'
      },
      {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash Thinking (Experimental)',
        description: 'Model optimized for complex reasoning tasks'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Previous generation fast model'
      },
      {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash 8B',
        description: 'Smaller, faster variant of Gemini 1.5 Flash'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Previous generation pro model'
      }
    ]
  }

  isConfigured() {
    return !!this.getApiKey()
  }
}

export default new GeminiService()