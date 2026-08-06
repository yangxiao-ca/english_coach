// 提示词原文与调用方式 —— 与 lib/llm.ts 保持一致（改动提示词时请同步这里）

const PROMPT_ITEM_SCHEMA = `Return strict JSON only:
{
  "items": [
    {
      "expression": "string",
      "type": "word|phrase|collocation|sentence_pattern|golden_expression",
      "meaning_cn": "中文含义",
      "explanation_en": "short English explanation",
      "example_sentence": "natural spoken example",
      "speaking_scenario": "where the learner can say it",
      "why_learn": "why it improves speaking",
      "topic": "string",
      "difficulty_level": "A1|A2|B1|B2|C1|C2",
      "ai_value_score": 1-5,
      "speaking_usefulness_score": 1-5,
      "business_relevance_score": 1-5,
      "personal_relevance_score": 1-5
    }
  ]
}`;

// 提示词 1a：从粘贴的材料里提取学习词条（POST /api/materials/extract）
const PROMPT_EXTRACT_SYSTEM = `You are an English speaking coach and curriculum designer. Extract high-leverage learning_items for spoken English, not isolated vocabulary trivia. Prefer reusable phrases, collocations, sentence patterns, and golden expressions.

Item mix policy:
- Do include some abstract social-science vocabulary that educated people regularly read in mainstream news and use in discussion — e.g. policy, institution, accountability, transparency, consensus, polarization, sustainability, paradigm, legitimacy, implication, perception, discourse, narrative, initiative, phenomenon, inequality. No fixed proportion required; just make sure such words are represented.
- Keep such abstract items relatively common: they must appear in mainstream news/newspapers and stay usable in everyday conversation, NOT rare academic or specialized jargon. If a word would only show up in academic papers, exclude it.
- For every abstract item, still provide a concrete everyday speaking scenario and a natural example sentence so the learner can actually use it in conversation.

${PROMPT_ITEM_SCHEMA}`;
const PROMPT_EXTRACT_USER = `Material title: {title}
Topic: {topic}
Difficulty: {difficulty}
Learner purpose: {purpose}

Material:
{content}

{extra_requirements}
Choose 8-15 items that are useful for speaking practice.`;

// 提示词 1b：AI 直接生成一段材料并产出词条（POST /api/materials/generate）
const PROMPT_GENERATE_SYSTEM = `You are an English speaking coach for adult learners who want higher-value spoken English.

Generate practical but non-basic learning_items for a learner to activate in conversation. The items should feel useful for real adult conversation, workplace discussion, interviews, meetings, opinions, storytelling, negotiation, and nuanced self-expression.

Difficulty policy:
- Respect the requested difficulty strictly.
- If the user asks for B1, generate solid B1-B2 items, not A1/A2 beginner items.
- If the user asks for B2, generate B2-C1 items.
- If the user asks for C1, generate C1 items with nuance, precision, and natural phrasing.
- Avoid overly simple textbook expressions such as "by the way", "make a decision", "I think", "very good", "have you ever", unless the user's requested difficulty is A1/A2.
- Prefer reusable sentence frames, collocations, discourse phrases, and golden expressions that help the learner sound more natural and articulate.
- Avoid rare, literary, slangy, or test-only expressions.

${PROMPT_ITEM_SCHEMA}`;
const PROMPT_GENERATE_USER = `Generate {count} learning_items.
Topic: {topic}
Difficulty: {difficulty}
Speaking scenario: {scenario}
Learner goal: {goal}

Balance types across word, phrase, collocation, sentence_pattern, and golden_expression.

Prioritize expressions that are slightly above the learner's comfort zone but still usable in speaking. For each item, make why_learn specific and explain the speaking value.`;

// 提示词 2：生成今日训练内容（含豆包指令），POST /api/sessions
const PROMPT_PLAN_SYSTEM = `You are a strict but encouraging English speaking teacher. Build today's small speaking practice package from target learning_items.

CRITICAL SCOPE RULE — use ONLY the provided items:
- target_expressions must be EXACTLY the expressions of the provided learning_items — never invent, substitute, add, or drop any of them.
- sentence_drills, scenario_tasks, speaking tasks and the Doubao prompt may use supporting words to frame examples, but must NOT introduce any new expression as something to learn. Every drill and task must revolve around exactly the provided expressions.
- Cover all provided expressions; if the provided list is short, go deeper on each one instead of adding new ones.

The Doubao prompt should make Doubao teach the learner expressions directly, not only role-play. It must clearly require Doubao to speak English only during coaching: all explanations, corrections, examples, encouragement, questions, and scenario practice must be in English. Do not let Doubao use Chinese during the practice.

It must ask Doubao to follow this flow:
1. Present each target expression with a simple English meaning and one natural full sentence.
2. Ask the learner to repeat the full sentence exactly.
3. Ask the learner to make 1-2 original sentences using the expression.
4. Correct the learner's sentence briefly in English and give a more natural version.
5. After all expressions, run a short scenario practice that encourages natural use of the expressions.
6. At the end, provide a clean transcript that the learner can paste back into this app for assessment.

Return JSON only:
{
  "title": "string",
  "target_expressions": ["string"],
  "sentence_drills": ["string"],
  "scenario_tasks": ["string"],
  "speaking_task_30s": "string",
  "speaking_task_90s": "string",
  "doubao_prompt": "Instruction the learner can copy into Doubao. It must require English-only coaching, teach ONLY the target_expressions listed above (no extra words to learn), full-sentence repetition, learner-created sentences, correction, then a short scenario practice and final transcript."
}`;
const PROMPT_PLAN_USER = `Target learning_items (these are the ONLY expressions to learn today):
{items_json}

Create a compact but complete session. Use ONLY the expressions above as target_expressions — do NOT add, substitute, or rename any of them. Every drill, task, and the Doubao instruction must revolve around exactly these expressions.

Make the Doubao prompt practical and direct. The learner wants Doubao to guide the whole session in English only. The learner wants to learn these exact expressions immediately, including whole-sentence repetition and making their own sentences.`;

function CodeBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-black uppercase tracking-wide text-[#8a6d3b]">{title}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-white p-4 font-mono text-xs leading-5 text-[#3a4245]">{text}</pre>
    </div>
  );
}

export default function UsageGuide() {
  return (
    <div className="grid gap-5">
      {/* 一、系统简介 */}
      <section className="panel p-5">
        <h2 className="text-lg font-black">一、这个系统是做什么的</h2>
        <p className="mt-2 text-sm leading-7 text-[#536267]">
          这是一个本地单人英语口语学习系统：把任意英文材料变成「学习词条」，AI 据此生成今日训练内容（含豆包陪练指令），
          你在豆包 App 里完成真实口语练习，再把转写贴回来，由 AI 评估并安排复习，形成「选词 → 练 → 评 → 复习」的闭环。
          所有数据都保存在本地 SQLite 数据库里，不依赖网络存储。
        </p>
      </section>

      {/* 二、操作流程 */}
      <section className="panel grid gap-4 p-5">
        <h2 className="text-lg font-black">二、完整操作流程</h2>
        <p className="text-sm leading-7 text-[#536267]">整个系统分三大块，对应左侧边栏的三个分组：</p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded bg-mist p-4">
            <h3 className="font-black text-[#5f7d4f]">① 学习库 —— 维护与生成</h3>
            <ol className="mt-2 grid gap-1 text-sm leading-6 text-[#536267]">
              <li>1. 「添加材料」：粘贴一段英文（文章 / 聊天记录 / 邮件 / 字幕）或让 AI 生成一段材料；</li>
              <li>2. 材料被解析成候选词条，进入「待审」；</li>
              <li>3. 审阅候选：把值得学的「加入学习库」，不合适的设为「以后再看」或忽略；</li>
              <li>4. 在学习库浏览全部词条，勾选今天的，点「确认并添加到今日学习」。</li>
            </ol>
          </div>

          <div className="rounded bg-mist p-4">
            <h3 className="font-black text-[#c05c3c]">② 今日学习 —— 生成与陪练</h3>
            <ol className="mt-2 grid gap-1 text-sm leading-6 text-[#536267]">
              <li>1. 「今日训练」页会承接你从学习库选好的词条（可随时删减、退回）；</li>
              <li>2. 点「AI 生成今日训练材料」，生成目标表达、句型训练、场景任务、口语任务和豆包陪练指令；</li>
              <li>3. 内容不满意可以手动调整、重新生成，或「清空当日 AI 已生成内容」重来；</li>
              <li>4. 复制「豆包智能体陪练指令」，粘贴到豆包 App 完成口语练习；</li>
              <li>5. 把豆包的对话转写贴回「录入反馈」交给 AI 评估。</li>
            </ol>
          </div>

          <div className="rounded bg-mist p-4">
            <h3 className="font-black text-[#a37d2f]">③ 反馈与记录 —— 评估与复习</h3>
            <ol className="mt-2 grid gap-1 text-sm leading-6 text-[#536267]">
              <li>1. 「录入反馈」：粘贴豆包转写，AI 打分、纠错，并自动生成每个词条的复习计划；</li>
              <li>2. 「学习报告」：查看掌握度、复习到期项、历史练习统计；</li>
              <li>3. 到期复习的词条会重新出现在「今日训练」里，进入下一轮闭环。</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 三、大章节：学新词的标准与目标 */}
      <section className="panel grid gap-5 border-[#c05c3c]/40 bg-[#fffaf7] p-6">
        <div className="grid gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-[#c05c3c]">核心章节 · 请务必阅读</p>
          <h2 className="text-2xl font-black">三、学新词的标准与目标</h2>
          <p className="mt-1 text-sm leading-7 text-[#536267]">
            这是整个系统最重要的设计原则：<b className="text-ink">不学太简单的词，只学「在生活中真的有使用频率」的表达。</b>
            下面先讲怎么选词，再讲一个词条要学到什么程度才算合格。
          </p>
        </div>

        {/* 3.1 选词标准 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">3.1 选词标准：什么样的表达值得学</h3>
          <p className="text-sm leading-7 text-[#536267]">
            拿到一个候选词条时，用下面五条逐一自问，全部通过才加入学习库：
          </p>
          <ol className="grid gap-3">
            <li className="rounded border border-[#c05c3c]/20 bg-white p-3 text-sm leading-6">
              <b>① 使用频率（最重要）：</b>它出现在你未来真实英文对话里的概率有多大？工作沟通、点餐出行、聊天社交、表达观点……越常出现越值得学。判断标尺就一句话：<i>「三个月后我大概率还会用到它吗？」</i>
            </li>
            <li className="rounded border border-[#c05c3c]/20 bg-white p-3 text-sm leading-6">
              <b>② 难度定位：不要太简单。</b>hello / thank you / good 这类你已经能脱口而出的词，不学——那是浪费时间。真正该学的是「<b>看着认识、但自己从不会主动说</b>」的那一类。
            </li>
            <li className="rounded border border-[#c05c3c]/20 bg-white p-3 text-sm leading-6">
              <b>③ 完整表达单元优先：</b>短语、固定搭配、句型比孤立的单词更有价值。学 <i>look forward to</i>、<i>I&apos;m not really into…</i>，而不是孤零零的 honest / forward。
            </li>
            <li className="rounded border border-[#c05c3c]/20 bg-white p-3 text-sm leading-6">
              <b>④ 拒绝生僻词：</b>词典标注 rare / 古语 / 文学用词的、现实中几乎没人说的，不进学习库（除非纯个人兴趣）。
            </li>
            <li className="rounded border border-[#c05c3c]/20 bg-white p-3 text-sm leading-6">
              <b>⑤ 新鲜感测试：</b>看到中文能立刻说出英文 → 已经会了，跳过；看到英文能懂但自己从不会主动用 → 正是要学的。
            </li>
          </ol>
        </div>

        {/* 3.2 选词方法 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">3.2 选词方法：从材料里怎么挑</h3>
          <p className="text-sm leading-7 text-[#536267]">
            系统会自动从你提供的材料里提取候选词条，但最终把关的是你。实操上优先选这几类：
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="rounded bg-white p-3 text-sm leading-6 text-[#536267]">· <b>高频动词短语</b>：look forward to、run into、put off、figure out</p>
            <p className="rounded bg-white p-3 text-sm leading-6 text-[#536267]">· <b>日常态度表达</b>：as a matter of fact、to be honest、I&apos;d say…</p>
            <p className="rounded bg-white p-3 text-sm leading-6 text-[#536267]">· <b>高频名词搭配</b>：make a reservation、take it personally、have a say in…</p>
            <p className="rounded bg-white p-3 text-sm leading-6 text-[#536267]">· <b>整块可用的句型骨架</b>：Do you mind if I…?、I was wondering if…、It&apos;s worth -ing</p>
          </div>
          <p className="text-sm leading-7 text-[#536267]">
            <b>来源建议：</b>粘贴你<b>真实会遇到</b>的英文——职场邮件、聊天记录、YouTube 字幕、点餐菜单、新闻标题。材料越贴近你的生活，提取出的词越有用。每天挑 6–8 个加入今日学习即可，不要贪多。
          </p>
          <p className="text-sm leading-7 text-[#536267]">
            <b>抽象社科词：</b>系统提取时会包含<b>相对常用的抽象社科词汇</b>——新闻报纸上经常读到、知识阶层讨论时常用的那种（policy、accountability、consensus、polarization、implication 等），不强制数量比例。它们必须常见于主流新闻、能在日常对话里自然使用，而不是学术黑话；只在论文里出现的词，照旧跳过。
          </p>
        </div>

        {/* 3.3 学习目标 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">3.3 学习目标：一个词条学到什么程度算「学会」</h3>
          <p className="text-sm leading-7 text-[#536267]">目标分四层，从低到高。当日训练至少要达到「产出层」，最终要走到「应用层」：</p>
          <div className="grid gap-3">
            <div className="rounded border-l-4 border-[#a8b8a0] bg-white p-3 text-sm leading-6">
              <b>认知层（最低要求）：</b>听到 / 看到能立刻反应出意思，不需要经过中文翻译。
            </div>
            <div className="rounded border-l-4 border-[#d3a25a] bg-white p-3 text-sm leading-6">
              <b>产出层（当日训练必须达到）：</b>能准确、自然地说出来（发音、重音、连读不卡壳），并能造一个<b>自己真实场景</b>的句子——而不是背例句。
            </div>
            <div className="rounded border-l-4 border-[#c05c3c] bg-white p-3 text-sm leading-6">
              <b>应用层（陪练环节检验）：</b>当天在豆包陪练里<b>主动用出至少 1 次</b>。只会读不会用，等于没学会。
            </div>
            <div className="rounded border-l-4 border-[#536267] bg-white p-3 text-sm leading-6">
              <b>巩固层（复习保证）：</b>靠系统安排的第 7 天等间隔复习，隔几天还能自然说出口，才算真正进入长期记忆。
            </div>
          </div>
          <p className="text-sm leading-7 text-[#536267]">
            简单说，每个词条的合格标准就是一句话：<b className="text-ink">「听懂 → 说得出 → 当天用出去 → 过几天还记得」</b>。
            每次录完反馈，如果 AI 提示某个词条还是磕巴，就把它重新放回今日训练再练一轮。
          </p>
        </div>

        {/* 3.4 速查清单 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">3.4 每日操作速查</h3>
          <ol className="grid gap-1 rounded bg-white p-4 text-sm leading-7 text-[#536267]">
            <li>1. 添加 1 段真实生活英文材料（或让 AI 生成）；</li>
            <li>2. 审阅候选：太简单？太生僻？日常用得上吗？—— 三问过后再入学习库；</li>
            <li>3. 挑 6–8 个 → 「添加到今日学习」→ 今日训练页生成内容；</li>
            <li>4. 复制豆包指令 → 豆包陪练 10–15 分钟，尽量主动用上新词；</li>
            <li>5. 转写贴回「录入反馈」，看评估、安排复习；</li>
            <li>6. 第二天从学习报告/今日训练接着复习到期词条。</li>
          </ol>
        </div>
      </section>

      {/* 四、系统设计思路 */}
      <section className="panel grid gap-4 p-5">
        <h2 className="text-lg font-black">四、系统设计思路</h2>
        <div className="grid gap-3 text-sm leading-7 text-[#536267]">
          <p>
            <b>核心实体（SQLite 表）：</b>materials（材料）→ learning_items（学习词条）→ study_sessions（今日训练包）→
            assessments（评估）→ review_schedules（复习计划）。词条状态流转：candidate（待审）→ active（学习库）→ today（暂存，选好未编入）→ active。
          </p>
          <p>
            <b>单一真相来源：</b>「今天学什么」以 <code className="rounded bg-mist px-1 font-mono text-xs">study_sessions.target_item_ids</code> 为权威清单；
            <code className="rounded bg-mist px-1 font-mono text-xs">status=&quot;today&quot;</code> 只是「已在库选好、还没编入」的暂存标记。
            今日训练页显示的词条 = 已编入 + 待加入，生成时<b>只包含页面上看到的词条</b>，历史残留不会自动混入。
          </p>
          <p>
            <b>AI 调用链：</b>设置页配置 provider / API Key / model → 所有 AI 调用统一走 lib/llm.ts 的 jsonCall（
            <code className="rounded bg-mist px-1 font-mono text-xs">temperature 0.35</code>、强制 JSON 输出）→
            各 API 路由（/api/materials/extract、/api/materials/generate、/api/sessions、/api/assessments）→ 页面展示。
            修改任意提示词后，请同步更新本文档第五节。
          </p>
          <p>
            <b>闭环：</b>材料 → 词条 → 今日训练（豆包陪练）→ 转写评估 → 复习调度 → 到期回流到今日训练，一轮一轮巩固。
          </p>
        </div>
      </section>

      {/* 五、两段核心提示词 */}
      <section className="panel grid gap-5 border-[#c05c3c]/40 bg-[#fffaf7] p-6">
        <div className="grid gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-[#c05c3c]">开发者向 · 提示词原文</p>
          <h2 className="text-2xl font-black">五、两段核心提示词（原文与调用方式）</h2>
          <p className="mt-1 text-sm leading-7 text-[#536267]">
            下面两段是系统内部真正发给 LLM 的提示词：一段把材料变成学习词条，一段生成今日训练内容（含你复制到豆包的指令）。
            看完你就知道「页面上的内容是背后怎么来的」，也可以自己到 <code className="rounded bg-mist px-1 font-mono text-xs">lib/llm.ts</code> 里改。
          </p>
        </div>

        {/* 5.1 从材料生成词条 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">5.1 从材料里 AI 生成学习词条</h3>
          <p className="text-sm leading-7 text-[#536267]">
            <b>触发位置：</b>学习库 → 添加材料 → 「粘贴材料」页。前端把表单内容发给 <code className="rounded bg-mist px-1 font-mono text-xs">POST /api/materials/extract</code>，
            请求体为 <code className="rounded bg-mist px-1 font-mono text-xs">{"{ title, topic, difficulty, purpose, content, extraRequirements? }"}</code>；
            后端调用 lib/llm.ts 的 <code className="rounded bg-mist px-1 font-mono text-xs">extractItemsFromMaterial()</code>，用你配置的模型 + temperature 0.35 + JSON 输出，
            提取 8–15 个词条后以「候选」状态写入 learning_items（之后你去「待审」里把关）。
          </p>
          <p className="text-sm leading-7 text-[#536267]">
            <b>临时要求（一次性）：</b>表单底部的「临时要求（可选）」输入框只对<b>本次提取</b>生效——填的内容会以
            &quot;Additional one-off requirements for this extraction (follow these strictly):&quot; 拼进下方的 User Prompt
            （即 <code className="rounded bg-mist px-1 font-mono text-xs">{"{extra_requirements}"}</code> 占位符），
            例如「多提取一些商务谈判相关的表达」「这次不提取太口语化的词」。它不保存、不影响后续提取。
          </p>
          <CodeBlock title="System Prompt（角色 + 指令 + 输出约束）" text={PROMPT_EXTRACT_SYSTEM} />
          <CodeBlock title="User Prompt（每次调用时用真实值替换 {占位符}）" text={PROMPT_EXTRACT_USER} />
          <p className="text-sm leading-7 text-[#536267]">
            <b>输出 JSON 结构（itemSchema）：</b>每个词条包含 expression（表达）、type（word/phrase/collocation/sentence_pattern/golden_expression）、
            meaning_cn（中文含义）、explanation_en（英文解释）、example_sentence（例句）、speaking_scenario（使用场景）、
            why_learn（学习理由）、difficulty_level（A1–C2）和四个 1–5 分维度的价值评分。评分用来支持学习库的排序与「候选」筛选。
          </p>
          <CodeBlock title="输出 JSON Schema" text={PROMPT_ITEM_SCHEMA} />
          <p className="text-sm leading-7 text-[#536267]">
            <b>补充 —— 「AI 生成材料」页</b>（<code className="rounded bg-mist px-1 font-mono text-xs">POST /api/materials/generate</code>，参数
            <code className="rounded bg-mist px-1 font-mono text-xs">{"{ topic, difficulty, scenario, goal, count }"}</code>）：
            不依赖你粘贴内容，直接按主题生成词条。它的 system prompt 里写死了<b>难度政策</b>——要 B1 就给 B1–B2、要 B2 就给 B2–C1，明确禁止
            &quot;by the way / make a decision / I think / very good&quot; 这类过于简单的教科书表达，除非你要 A1/A2。这正是「不学太简单的词」在提示词层面的落实：
          </p>
          <CodeBlock title="System Prompt（AI 生成材料版）" text={PROMPT_GENERATE_SYSTEM} />
        </div>

        {/* 5.2 生成豆包训练内容 */}
        <div className="grid gap-3">
          <h3 className="text-lg font-black">5.2 生成豆包训练内容（你复制的那段指令）</h3>
          <p className="text-sm leading-7 text-[#536267]">
            <b>触发位置：</b>今日训练页点「AI 生成今日训练材料」或「重新生成今日训练」→
            <code className="rounded bg-mist px-1 font-mono text-xs">POST /api/sessions</code>（mode 为 selected_ai / regenerate，携带当前页面的
            <code className="rounded bg-mist px-1 font-mono text-xs">item_ids</code>）→ 后端调用 lib/llm.ts 的
            <code className="rounded bg-mist px-1 font-mono text-xs">generateSessionPlan()</code>。返回的 plan 里
            <code className="rounded bg-mist px-1 font-mono text-xs">doubao_prompt</code> 字段就是你在页面「复制」的那段豆包指令。
          </p>
          <CodeBlock title="System Prompt（角色 + 六步陪练流程 + JSON 输出）" text={PROMPT_PLAN_SYSTEM} />
          <CodeBlock title="User Prompt（词条 JSON 序列化后填入）" text={PROMPT_PLAN_USER} />
          <p className="text-sm leading-7 text-[#536267]">
            <b>这段指令为什么长这样：</b>它强制豆包在陪练全程<b>只说英文</b>（解释、纠错、举例、鼓励都不得用中文），并按
            <b>「释义 → 整句跟读 → 自己造句 → 简短纠错 → 场景练习 → 输出转写」</b>六步走，保证你练的是「产出」而不是「认读」。
            最后一步要求豆包给出干净的对话转写，就是为了让你能贴回「录入反馈」让系统评估。
          </p>
        </div>
      </section>

      {/* 六、常见问题 */}
      <section className="panel grid gap-3 p-5">
        <h2 className="text-lg font-black">六、常见问题</h2>
        <div className="grid gap-2 text-sm leading-7 text-[#536267]">
          <p><b>Q：今日训练的词条怎么删减？</b> 在今日训练页，「本次训练包含的词条」每条都有「移除」按钮，移除后会退回「待加入」，随时可以再编入。</p>
          <p><b>Q：生成的内容不满意怎么办？</b> 可以手动调整任何字段；点「重新生成今日训练」会覆盖当前内容（有确认）；点「清空当日 AI 已生成内容」可以完全重来，词条不会丢。</p>
          <p><b>Q：豆包指令怎么用？</b> 在今日训练页复制「豆包智能体陪练指令」，粘贴到豆包 App 的智能体对话里开始练习；练完把整段对话复制回来，贴进「录入反馈」即可。</p>
          <p><b>Q：API Key 在哪里配置？</b> 本页顶部切到「AI 设置」，选择服务商（DeepSeek / GLM / OpenAI），填入 key 保存即可。</p>
          <p><b>Q：学了的词条为什么又出现在今日训练里？</b> 那是到了复习时间。到期复习是闭环的一部分，巩固一次比学新词更重要。</p>
          <p><b>Q：生成内容为什么混进了没选的词条？</b> 这是旧版本的 bug，已修复：现在生成<b>只包含页面上显示的词条</b>（已编入 + 待加入）。如果旧内容里还有多余词条，用「移除」或「清空重来」处理即可。</p>
        </div>
      </section>
    </div>
  );
}
