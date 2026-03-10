export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {/* SideQuest.me logo — using SVG inline or from public/logos */}
        <svg
          className="w-32 h-32 mx-auto mb-8"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simple logo placeholder: SQ monogram */}
          <text
            x="100"
            y="120"
            fontSize="80"
            fontWeight="900"
            textAnchor="middle"
            fill="currentColor"
            className="font-head"
          >
            SQ
          </text>
        </svg>
        <h1 className="text-2xl font-head font-bold uppercase tracking-tight">
          sidequest.me
        </h1>
      </div>
    </main>
  );
}
