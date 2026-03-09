"use client";

import { useEffect, useRef } from "react";
import { Station, DISCIPLINE_COLOURS, TRACK_LABELS } from "@/lib/career-data";

interface TubeMapProps {
  stations: Station[];
}

export default function TubeMap({ stations }: TubeMapProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  /* Sort stations descending by idx so highest (most recent) renders at top */
  const sorted = [...stations].sort((a, b) => b.idx - a.idx);

  useEffect(() => {
    drawTubeLines();
    window.addEventListener("resize", drawTubeLines);
    return () => window.removeEventListener("resize", drawTubeLines);
  });

  function drawTubeLines() {
    const tm = gridRef.current;
    if (!tm) return;

    /* Remove old SVG */
    const oldSvg = tm.querySelector(".tm-svg");
    if (oldSvg) oldSvg.remove();

    /* Create fresh SVG */
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("tm-svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.setAttribute("preserveAspectRatio", "none");
    const rect = tm.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    tm.style.position = "relative";
    tm.prepend(svg);

    /* Gather station elements sorted ascending by data-idx */
    const stationEls = Array.from(tm.querySelectorAll<HTMLElement>("[data-idx]"));
    stationEls.sort(
      (a, b) => parseInt(a.dataset.idx!) - parseInt(b.dataset.idx!)
    );

    const colourMap: Record<string, string> = {
      commercial: "#E53935",
      product: "#1E88E5",
      marketing: "#43A047",
    };

    const lineWidth = 6;
    const curveR = 18;

    for (let i = 0; i < stationEls.length - 1; i++) {
      const a = stationEls[i];
      const b = stationEls[i + 1];
      const dotA = a.querySelector(".tm-dot") as HTMLElement;
      const dotB = b.querySelector(".tm-dot") as HTMLElement;
      if (!dotA || !dotB) continue;

      const rA = dotA.getBoundingClientRect();
      const rB = dotB.getBoundingClientRect();
      const x1 = rA.left + rA.width / 2 - rect.left;
      const y1 = rA.top + rA.height / 2 - rect.top;
      const x2 = rB.left + rB.width / 2 - rect.left;
      const y2 = rB.top + rB.height / 2 - rect.top;

      const discA = a.dataset.disc!;
      const discB = b.dataset.disc!;
      let d: string;

      if (Math.abs(x1 - x2) < 2) {
        /* Same track — straight vertical */
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        /* Track switch — tube elbow: vertical → curve → horizontal → curve → vertical */
        const midY = (y1 + y2) / 2;
        const dx = x2 > x1 ? 1 : -1;
        const r = curveR;

        d =
          `M ${x1} ${y1}` +
          ` L ${x1} ${midY + r}` +
          ` Q ${x1} ${midY}, ${x1 + dx * r} ${midY}` +
          ` L ${x2 - dx * r} ${midY}` +
          ` Q ${x2} ${midY}, ${x2} ${midY - r}` +
          ` L ${x2} ${y2}`;
      }

      /* Create SVG path */
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", String(lineWidth));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");

      /* Gradient for discipline transitions (33/33/33 blend) */
      if (discA !== discB) {
        const gradId = `grad-${i}`;
        let defs = svg.querySelector("defs");
        if (!defs) {
          defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          svg.appendChild(defs);
        }
        const grad = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "linearGradient"
        );
        grad.setAttribute("id", gradId);
        grad.setAttribute("x1", "0");
        grad.setAttribute("y1", "1");
        grad.setAttribute("x2", "0");
        grad.setAttribute("y2", "0");

        const stops = [
          { offset: "0%", color: colourMap[discA] },
          { offset: "33%", color: colourMap[discA] },
          { offset: "67%", color: colourMap[discB] },
          { offset: "100%", color: colourMap[discB] },
        ];
        stops.forEach((s) => {
          const stop = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "stop"
          );
          stop.setAttribute("offset", s.offset);
          stop.setAttribute("stop-color", s.color);
          grad.appendChild(stop);
        });
        defs.appendChild(grad);
        path.setAttribute("stroke", `url(#${gradId})`);
      } else {
        path.setAttribute("stroke", colourMap[discA]);
      }

      svg.appendChild(path);
    }
  }

  return (
    <>
      {/* Track column headers */}
      <div className="tm-track-headers">
        <div />
        {TRACK_LABELS.map((t) => (
          <div
            key={t.track}
            className="tm-track-label"
            style={{ borderColor: t.colour }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Grid with stations (highest idx at top) */}
      <div className="tm-grid" ref={gridRef}>
        {sorted.map((s) => (
          <StationRow key={s.idx} station={s} />
        ))}
      </div>
    </>
  );
}

function StationRow({ station }: { station: Station }) {
  const s = station;
  const colour = DISCIPLINE_COLOURS[s.discipline];
  return (
    <>
      <div className="tm-year">{s.year}</div>
      <div
        className="tm-station"
        data-idx={s.idx}
        data-disc={s.discipline}
        style={{ gridColumn: s.track + 1 }}
      >
        <div className="tm-dot" style={{ background: colour }} />
        <div className="tm-label">
          <span className="tm-role">{s.role}</span>
          <br />
          <span className="tm-date">{s.dates}</span>
        </div>
      </div>
    </>
  );
}