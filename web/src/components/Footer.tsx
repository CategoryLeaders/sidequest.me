export default function Footer() {
  return (
    <footer className="border-t-3 border-ink px-8 py-7 flex justify-between items-center flex-wrap gap-4 font-mono text-[0.68rem]">
      <span className="text-ink/30">&copy; 2026 Sidequest Ventures, a trading name of Category Leaders Ltd</span>
      <span className="flex gap-1.5">
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink no-underline border-b-2 border-ink hover:text-orange transition-colors"
        >
          Twitter
        </a>
        {" · "}
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink no-underline border-b-2 border-ink hover:text-orange transition-colors"
        >
          LinkedIn
        </a>
        {" · "}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink no-underline border-b-2 border-ink hover:text-orange transition-colors"
        >
          GitHub
        </a>
      </span>
    </footer>
  );
}
