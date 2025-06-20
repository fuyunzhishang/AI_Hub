import axios from 'axios';
import digitalHumanConfig from './config/digitalHuman.js';

const BASE_URL = 'http://localhost:3099/api/digital-human';
// 使用配置文件中的Bearer Token
const BEARER_TOKEN = digitalHumanConfig.pomegranateToken.replace('Bearer ', '');

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`
  }
});

// 测试所有Speaker API端点
async function testSpeakerAPIs() {
  console.log('🚀 开始测试Speaker API端点...\n');

  const tests = [
    {
      name: '1. 查询音色列表',
      method: 'POST',
      endpoint: '/speaker/list',
      data: {}
    },
    {
      name: '2. 生成文件上传URL (音频)',
      method: 'POST',
      endpoint: '/upload/get-put-url',
      data: {
        type: 'audio',
        suffix: 'mp3'
      }
    },
    {
      name: '3. 生成文件上传URL (视频)',
      method: 'POST',
      endpoint: '/upload/get-put-url',
      data: {
        type: 'video',
        suffix: 'mp4'
      }
    },
    {
      name: '4. 创建音色 (需要真实音频URL)',
      method: 'POST',
      endpoint: '/speaker/create',
      data: {
        audioUrl: 'https://example.com/test.mp3',
        title: 'API测试音色',
        model: 'V1.0'
      },
      skipTest: true // 跳过此测试，因为需要真实的音频URL
    },
    {
      name: '5. 语音合成 (需要真实speakerId)',
      method: 'POST',
      endpoint: '/speaker/tts',
      data: {
        text: '这是一个API测试文本',
        speakerId: 123456789,
        speedRatio: 1.0
      },
      skipTest: true // 跳过此测试，因为需要真实的speakerId
    },
    {
      name: '6. 查询音色状态 (需要真实speakerId)',
      method: 'POST',
      endpoint: '/speaker/status',
      data: {
        speakerId: 123456789
      },
      skipTest: true // 跳过此测试，因为需要真实的speakerId
    }
  ];

  for (const test of tests) {
    console.log(`📋 ${test.name}`);
    
    if (test.skipTest) {
      console.log('   ⏭️  跳过测试 (需要真实数据)\n');
      continue;
    }

    try {
      const response = await client.request({
        method: test.method,
        url: test.endpoint,
        data: test.data
      });

      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   📄 响应数据:`, JSON.stringify(response.data, null, 2));
      console.log('');
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ 错误状态码: ${error.response.status}`);
        console.log(`   💬 错误响应:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log(`   🌐 请求错误: 无法连接到服务器`);
        console.log(`   📍 URL: ${BASE_URL}${test.endpoint}`);
      } else {
        console.log(`   ⚠️  其他错误: ${error.message}`);
      }
      console.log('');
    }
  }
}

// 测试路由可访问性
async function testRouteAccessibility() {
  console.log('🔗 测试路由可访问性...\n');
  
  const routes = [
    '/speaker/list',
    '/speaker/create',
    '/speaker/tts',
    '/speaker/status',
    '/speaker/recreate',
    '/speaker/delete',
    '/speaker/recreated-record',
    '/upload/get-put-url'
  ];

  for (const route of routes) {
    try {
      const response = await client.post(route, {});
      console.log(`✅ ${route} - 可访问 (状态码: ${response.status})`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ ${route} - 可访问 (参数验证正常)`);
      } else if (error.response && error.response.status === 401) {
        console.log(`⚠️  ${route} - 需要认证 (状态码: 401)`);
      } else if (error.response && error.response.status === 500) {
        console.log(`❌ ${route} - 服务器错误 (状态码: 500)`);
      } else {
        console.log(`❌ ${route} - 无法访问: ${error.message}`);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('🧪 Speaker API 测试工具\n');
  console.log(`🎯 目标服务器: ${BASE_URL}`);
  console.log(`🔑 认证令牌: ${BEARER_TOKEN.substring(0, 10)}...`);
  console.log('='.repeat(60) + '\n');

  await testRouteAccessibility();
  console.log('\n' + '='.repeat(60) + '\n');
  await testSpeakerAPIs();

  console.log('✨ 测试完成!');
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testSpeakerAPIs, testRouteAccessibility };