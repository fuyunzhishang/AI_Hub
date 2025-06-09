# API 文档使用说明

## Swagger UI 访问

项目已集成 Swagger UI，启动服务器后可通过以下地址访问：

- **Swagger UI**: http://localhost:3099/api-docs
- **OpenAPI JSON**: http://localhost:3099/api-docs.json

## 功能特点

1. **交互式文档**: 可以直接在浏览器中测试所有 API
2. **自动生成**: 基于代码中的 Swagger 注释自动生成
3. **实时更新**: 修改注释后重启服务器即可看到更新

## 接入 Apifox

### 方法一：导入 OpenAPI 规范

1. 打开 Apifox
2. 创建新项目或选择现有项目
3. 点击「导入」->「OpenAPI/Swagger」
4. 选择导入方式：
   - **URL 导入**: 输入 `http://localhost:3099/api-docs.json`
   - **文件导入**: 访问上述 URL 下载 JSON 文件后导入

### 方法二：自动同步

1. 在 Apifox 项目设置中选择「自动同步」
2. 添加数据源：
   - 类型：OpenAPI/Swagger
   - URL：`http://localhost:3099/api-docs.json`
   - 同步频率：根据需要设置

## API 分组

项目中的 API 已按功能分组：

- **音频处理**: 音频转码、数据提取等功能
- **语音服务**: 语音识别和语音合成功能
- **Google Files**: Google Files API 文件管理
- **腾讯云 STS**: 腾讯云临时密钥生成
- **测试**: API 连接测试

## 注意事项

1. 确保服务器运行在 `http://localhost:3099`
2. 生产环境需要修改 `config/swagger.js` 中的服务器配置
3. 文件上传接口在 Swagger UI 中可直接选择文件测试