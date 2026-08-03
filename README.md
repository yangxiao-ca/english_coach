# English Coach MVP

本项目是一个本地运行的英语口语学习教务系统 MVP。它以 `learning_item` 为学习对象，支持从材料提取、按目标生成、候选筛选、学习库管理、今日训练、豆包转写评估和自动复习调度。

## 技术栈

- Next.js
- TypeScript
- SQLite
- Tailwind CSS
- DeepSeek / GLM / OpenAI-compatible API

## 启动

1. 安装依赖

```bash
npm install
```

2. 配置 AI

```bash
cp .env.example .env.local
```

你可以打开 `/settings` 在前端界面里选择 DeepSeek、GLM 或 OpenAI，并填写 API Key。配置会保存在本地 SQLite。

也可以在 `.env.local` 里选择一个 AI 服务作为兜底配置。

使用 DeepSeek：

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-key
AI_MODEL=deepseek-v4-flash
```

使用 GLM / 智谱：

```bash
AI_PROVIDER=glm
GLM_API_KEY=your-glm-key
AI_MODEL=glm-5.2
```

也可以用通用写法覆盖默认配置：

```bash
AI_PROVIDER=deepseek
AI_API_KEY=your-key
AI_MODEL=deepseek-v4-flash
AI_BASE_URL=https://api.deepseek.com
```

默认端点：

- DeepSeek: `https://api.deepseek.com`
- GLM: `https://open.bigmodel.cn/api/paas/v4`

3. 启动本地服务

```bash
npm run dev
```

打开 `http://localhost:3000`。

## 页面

- `/input-material`：粘贴材料，调用 LLM 提取 learning_items
- `/generate-material`：按主题、难度、场景、目标生成 learning_items；默认 B2，并倾向生成更高价值的成人口语表达
- `/candidates`：筛选候选项，加入学习库、忽略、以后再看
- `/library`：查看、筛选、编辑、删除学习库；可把 item 加入今日学习清单，清单可移除，确认后 AI 自动补齐今日训练资料；支持按 AI/Speaking/Business/Personal 最低评分筛选，也支持按未学、今天学过、1/3/7/14/30 天前学习筛选，并可标记重点学习/一般学习/简单熟悉，以及已经掌握/初步了解/完全陌生
- `/session`：当天唯一学习包工作台；只负责展示、编辑、保存和复制豆包陪练指令。选材在 `/library` 完成，豆包指令会要求全程英语指导、逐个学习表达、整句复述、自己造句、纠错和最终转写
- `/transcript`：粘贴豆包练习后的转写文本并评估；没有录音/转写时，也可以勾选今日学习包中已练习的 item 做手动反馈
- `/assessment`：按日期查看评估报告和自动复习结果

## 数据库

SQLite 数据库会自动创建在：

```bash
data/english-coach.db
```

包含以下表：

- `learning_materials`
- `learning_items`
- `study_sessions`
- `practice_transcripts`
- `item_assessments`
- `review_schedules`

## 复习规则

- `not_used`：明天继续练
- `partial`：2 天后继续
- `forced`：3 天后继续，换场景
- `wrong`：明天继续，并加入纠错任务
- `correct`：7 天后复习
- `natural`：14 天后复习
- `creative`：30 天后复习，标记 mastered

## MVP 说明

这是本地单人版，没有账号系统，也没有语音功能。口语练习通过复制 `/session` 生成的豆包指令完成，再把练习转写文本贴回 `/transcript` 形成闭环。
