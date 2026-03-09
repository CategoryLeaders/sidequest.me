interface BlurbProps {
  left: { heading: string; content: string };
  right: { heading: string; content: string | string[] };
}

export default function Blurb({ left, right }: BlurbProps) {
  return (
    <div className="pro-blurb">
      <div>
        <h4>{left.heading}</h4>
        <p>{left.content}</p>
      </div>
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
    </div>
  );
}