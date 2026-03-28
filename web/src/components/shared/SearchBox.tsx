/* ── SearchBox — search input with ✕ clear button ── */
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

/** Wrap in Suspense because useSearchParams() requires it in App Router */
export function SearchBox(props: Props) {
  return (
    <Suspense fallback={<PlainInput {...props} />}>
      <SearchBoxInner {...props} />
    </Suspense>
  );
}

function PlainInput({ defaultValue = "", placeholder = "Search…", className }: Props) {
  return (
    <input
      name="q"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
    />
  );
}

function SearchBoxInner({ defaultValue = "", placeholder = "Search…", className }: Props) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{ paddingRight: value ? "2.5rem" : undefined }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85rem",
            lineHeight: 1,
            opacity: 0.4,
            color: "var(--ink)",
            padding: "4px",
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.4"; }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
