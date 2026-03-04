import { getIdeas } from "@/lib/notion";

type Idea = {
  id: string;
  type: "long" | "short";
  title?: string;
  description?: string;
  text?: string;
  date: string;
  tags?: string[];
};

// Fallback data for when Notion isn't connected
const fallbackIdeas: Idea[] = [];

const tagRotations = ["-0.5deg", "0.7deg", "-0.3deg", "0.5deg"];

export default async function IdeasPage() {
  let ideas: Idea[];

  try {
    ideas = await getIdeas();
    if (ideas.length === 0) ideas = fallbackIdeas;
  } catch {
    ideas = fallbackIdeas;
  }

  return (
    <main className="max-w-[800px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-circle"
        style={{ width: 80, height: 80, top: 20, right: -25 }}
      />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        Ideas &amp; Thoughts
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-8">
        Long-form articles and short-form hot takes. Powered by Notion.
      </p>

      <div className="flex flex-col gap-5">
        {ideas.map((idea) =>
          idea.type === "long" ? (
            <article
              key={idea.id}
              className="border-3 border-ink p-6 bg-white"
              style={{ borderLeftWidth: 6, borderLeftColor: "var(--lilac)" }}
            >
              <span className="badge badge-lilac mb-2 inline-block">
                Article
              </span>
              <h2 className="font-head font-bold text-[1.1rem] uppercase mt-2 mb-2">
                {idea.title}
              </h2>
              <p className="text-[0.88rem] opacity-70 leading-snug mb-3">
                {idea.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {idea.tags?.map((tag, j) => (
                  <span
                    key={tag}
                    className="sticker text-[0.6rem] !px-2.5 !py-1 !border-2"
                    style={{
                      transform: `rotate(${tagRotations[j % tagRotations.length]})`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <span className="font-mono text-[0.6rem] opacity-40 ml-auto">
                  {idea.date}
                </span>
              </div>
            </article>
          ) : (
            <article
              key={idea.id}
              className="border-3 border-ink p-5 bg-white"
              style={{ borderLeftWidth: 6, borderLeftColor: "var(--yellow)" }}
            >
              <span className="badge badge-yellow mb-2 inline-block">
                Thought
              </span>
              <p className="text-[0.92rem] leading-snug mt-2">{idea.text}</p>
              <span className="font-mono text-[0.6rem] opacity-40 mt-3 block text-right">
                {idea.date}
              </span>
            </article>
          )
        )}
      </div>
    </main>
  );
}
