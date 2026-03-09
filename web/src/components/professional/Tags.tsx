import { Tag } from "@/lib/career-data";

export default function Tags({ tags }: { tags: Tag[] }) {
  return (
    <div className="pro-tags">
      {tags.map((t, i) =>
        t.type === "rect" ? (
          <span key={i} className="pro-tag-rect">{t.label}</span>
        ) : (
          <span key={i} className="pro-tag-loz">{t.label}</span>
        )
      )}
    </div>
  );
}