import Link from "next/link";

const cards = [
  ["/input-material", "从材料提取", "粘贴文章、字幕或短文，让 AI 提取适合口语激活的 learning_items。"],
  ["/generate-material", "主动生成", "按主题、场景、目标生成候选表达。"],
  ["/session", "开始今日训练", "根据到期复习、弱项和新学习项生成训练包与豆包指令。"],
  ["/transcript", "提交转写评估", "粘贴和豆包练习后的文本，自动评估并更新复习时间。"]
];

export default function Home() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h1 className="text-3xl font-black">本地英语口语学习教务系统</h1>
        <p className="max-w-3xl text-[#536267]">
          这个 MVP 以 learning_item 为核心，帮你决定学什么、怎么练、练完如何评估，以及下次什么时候复习。
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {cards.map(([href, title, body]) => (
          <Link key={href} href={href} className="panel block p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#536267]">{body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
