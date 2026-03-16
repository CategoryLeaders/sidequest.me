interface BlurbProps {
  left: { heading: string; content: string } | null;
  right: { heading: string; content: string | string[] } | null;
}

export default function Blurb({ left, right }: BlurbProps) {
  if (!left && !right) return null;

  return (
    <div className="pro-blurb">
      {left && (
        <div>
          <h4>{left.heading}</h4>
          <p>{left.content}</p>
        </div>
      )}
      {right && (
        <div>
          <h4>{right.heading}</h4>
          {Array.isArray(right.content) ? (
            <ul>
              {right.content.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{right.content}</p>
          )}
        </div>
      )}
    </div>
  );
}
