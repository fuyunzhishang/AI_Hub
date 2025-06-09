// 验证COS上传功能的简单脚本
// 在服务器上运行以测试STS凭证和COS上传

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 配置信息
const config = {
  // 服务器地址，如果在本地测试，使用 http://localhost:3000
  serverUrl: 'http://localhost:3099',
  // 存储桶信息，格式为 bucketName-appId
  bucket: 'nahida-1314736083', // 请替换为你的存储桶
  region: 'ap-shanghai',
  // 测试文件路径，使用项目中已有的文件
  testFilePath: path.join(__dirname, 'package.json') 
};

async function testSTSCredential() {
  console.log('开始测试STS临时密钥获取...');
  
  try {
    // 获取临时密钥
    const response = await fetch(`${config.serverUrl}/api/sts/get-credential`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucket: config.bucket,
        region: config.region,
        allowPrefix: '*',
        durationSeconds: 1800,
        actionType: 'default'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('临时密钥获取成功!');
      console.log('密钥信息:', {
        tmpSecretId: data.data.credentials.tmpSecretId.substring(0, 10) + '...',
        sessionToken: data.data.credentials.sessionToken.substring(0, 10) + '...',
        startTime: new Date(data.data.startTime * 1000).toLocaleString(),
        expiredTime: new Date(data.data.expiredTime * 1000).toLocaleString()
      });
      return data.data;
    } else {
      console.error('获取临时密钥失败:', data.error);
      if (data.details) console.error('详细信息:', data.details);
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    return null;
  }
}

// 运行测试
(async () => {
  // 测试获取临时密钥
  const credentials = await testSTSCredential();
  
  if (!credentials) {
    console.error('测试终止: 无法获取临时密钥');
    return;
  }
  
  console.log('\n测试完成! 请按照以下步骤在浏览器中验证上传功能:');
  console.log('1. 在浏览器中访问: http://localhost:3000/cos-demo.html');
  console.log(`2. 输入存储桶名称: ${config.bucket}`);
  console.log(`3. 选择地域: ${config.region}`);
  console.log('4. 点击"获取临时密钥"按钮');
  console.log('5. 选择要上传的文件并点击"上传文件"按钮');
  console.log('6. 确认上传成功');
})();
