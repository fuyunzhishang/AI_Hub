/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 90200
 Source Host           : localhost:3306
 Source Schema         : digitalhuman

 Target Server Type    : MySQL
 Target Server Version : 90200
 File Encoding         : 65001

 Date: 05/07/2025 00:15:33
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for train_task
-- ----------------------------
DROP TABLE IF EXISTS `train_task`;
CREATE TABLE `train_task`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务类型: model(文本模型), voice(语音模型)',
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'wait' COMMENT '任务状态',
  `user_id` bigint(0) UNSIGNED NOT NULL COMMENT '用户ID',
  `work_id` bigint(0) UNSIGNED NOT NULL COMMENT '关联 user_model.id 或 user_voice.id',
  `ori_request_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '前端原始请求',
  `ori_response_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '三方原始返回',
  `video_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频URL',
  `audio_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '音频URL',
  `create_time` datetime(6) NOT NULL COMMENT '创建时间',
  `update_time` datetime(6) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '训练任务表）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_model
-- ----------------------------
DROP TABLE IF EXISTS `user_model`;
CREATE TABLE `user_model`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cover_img` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图片URL',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '视频标题',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '状态',
  `avatar_id` bigint(0) UNSIGNED NOT NULL COMMENT '数字人ID',
  `user_id` bigint(0) UNSIGNED NOT NULL COMMENT '用户ID',
  `ori_video_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '原始视频URL',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户模型表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
