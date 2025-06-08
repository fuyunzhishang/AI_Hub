# FFmpeg 安装指南

由于在使用此项目的音频转码和提取功能时需要 FFmpeg，请按照以下步骤安装：

## Windows 安装指南

1. 访问 FFmpeg 官方网站下载页面：https://ffmpeg.org/download.html
2. 点击 "Windows" 下的链接，建议选择 "gyan.dev" 提供的构建版本
3. 下载 "ffmpeg-release-essentials" 包（包含 .zip 或 .7z 文件）
4. 解压下载的文件到你选择的目录，例如 `C:\ffmpeg`
5. 将 FFmpeg 的 bin 文件夹添加到系统环境变量 PATH 中：
   - 右键点击 "此电脑" > "属性" > "高级系统设置" > "环境变量"
   - 在 "系统变量" 中找到 "Path" 变量并编辑
   - 添加 FFmpeg bin 文件夹路径，例如 `C:\ffmpeg\bin`
   - 点击确定保存更改
6. 重启命令提示符或 PowerShell 窗口
7. 验证安装是否成功：输入 `ffmpeg -version` 和 `ffprobe -version`，应该显示版本信息

## macOS 安装指南

使用 Homebrew 安装：

```bash
brew install ffmpeg
```

## Linux 安装指南

使用 apt（Debian/Ubuntu）：

```bash
sudo apt update
sudo apt install ffmpeg
```

使用 yum（CentOS/RHEL）：

```bash
sudo yum install epel-release
sudo yum install ffmpeg ffmpeg-devel
```

## 验证安装

安装完成后，打开终端或命令提示符，运行以下命令验证：

```
ffmpeg -version
ffprobe -version
```

如果显示版本信息，则表明安装成功。
