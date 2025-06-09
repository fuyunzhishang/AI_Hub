# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start server**: `npm start` (production) or `npm run dev` (development with auto-restart)
- **Port**: Runs on port 3099 by default (can be overridden with PORT environment variable)
- **Test**: No test framework currently configured

## Architecture Overview

This is an Express.js server providing audio processing and speech services with Tencent Cloud integration:

### Main Components

- **Audio Processing**: FFmpeg-based audio transcoding, metadata extraction, waveform/spectrum generation
- **Speech Services**: Text-to-speech and speech recognition using Tencent Cloud
- **File Upload**: Multer-based file handling with static serving from `/uploads`
- **Cloud Integration**: Tencent Cloud SDK integration with STS token generation

### Project Structure

- `index.js`: Main Express server entry point
- `controllers/`: Request handlers for audio, speech, and STS operations
- `services/`: Business logic layer containing FFmpeg operations and cloud service calls
- `routes/`: Express route definitions
- `public/`: Static web interface files including COS demo

### Key Dependencies

- **FFmpeg**: Required external dependency for audio processing (see FFMPEG_INSTALL.md)
- **Tencent Cloud SDK**: For speech services and cloud storage
- **Express + Multer**: File upload and web server handling

### Environment Variables

The application expects Tencent Cloud credentials:
- `TENCENTCLOUD_SECRET_ID`
- `TENCENTCLOUD_SECRET_KEY`

### API Endpoints

- `/api/audio/*`: Audio transcoding and data extraction
- `/api/speech/*`: Speech-to-text and text-to-speech services  
- `/api/sts/*`: Tencent Cloud STS token generation
- `/api/test`: Tencent Cloud API connectivity test

### File Handling

- Upload directory: `./uploads/` (served as static files)
- Temporary files are created during processing and should be cleaned up
- Supports multiple audio formats (MP3, WAV, OGG, M4A, FLAC)