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

      {/* 四、常见问题 */}
      <section className="panel grid gap-3 p-5">
        <h2 className="text-lg font-black">四、常见问题</h2>
        <div className="grid gap-2 text-sm leading-7 text-[#536267]">
          <p><b>Q：今日训练的词条怎么删减？</b> 在今日训练页，「本次训练包含的词条」每条都有「移除」按钮，移除后会退回「待加入」，随时可以再编入。</p>
          <p><b>Q：生成的内容不满意怎么办？</b> 可以手动调整任何字段；点「重新生成今日训练」会覆盖当前内容（有确认）；点「清空当日 AI 已生成内容」可以完全重来，词条不会丢。</p>
          <p><b>Q：豆包指令怎么用？</b> 在今日训练页复制「豆包智能体陪练指令」，粘贴到豆包 App 的智能体对话里开始练习；练完把整段对话复制回来，贴进「录入反馈」即可。</p>
          <p><b>Q：API Key 在哪里配置？</b> 本页顶部切到「AI 设置」，选择服务商（DeepSeek / GLM / OpenAI），填入 key 保存即可。</p>
          <p><b>Q：学了的词条为什么又出现在今日训练里？</b> 那是到了复习时间。到期复习是闭环的一部分，巩固一次比学新词更重要。</p>
        </div>
      </section>
    </div>
  );
}
