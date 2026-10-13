import { useState, useEffect, useRef } from "react";

export default function PageOutline({ headings, colors, scrollContainerRef, onJump }) {
  const [activeId, setActiveId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const rafId = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !headings.length) {
      setActiveId(null);
      return;
    }

    function computeActive() {
      const containerTop = container.getBoundingClientRect().top;
      let current = headings[0]?.id ?? null;
      for (const h of headings) {
        const el = document.getElementById(`block-${h.id}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - containerTop;
        // Anything that's scrolled past a small offset from the top counts as "current"
        if (top <= 96) current = h.id;
        else break;
      }
      setActiveId(current);
    }

    function onScroll() {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        computeActive();
      });
    }

    computeActive();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [headings, scrollContainerRef]);

  if (!headings.length) return null;

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: "fixed",
        right: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        maxHeight: "60vh",
        overflowY: "auto",
        padding: "6px 4px",
      }}
    >
      {headings.map(h => {
        const isActive = h.id === activeId;
        return (
          <div
            key={h.id}
            onClick={() => onJump(h.id)}
            title={h.text || "Untitled"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              cursor: "pointer",
              paddingLeft: (h.level - 1) * 10,
              maxWidth: expanded ? 180 : 24,
              transition: "max-width 0.16s cubic-bezier(.4,0,.2,1)",
              overflow: "hidden",
            }}
          >
            {expanded && (
              <span
                style={{
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: isActive ? colors.text : colors.muted,
                  fontWeight: isActive ? 600 : 400,
                  transition: "color 0.12s ease",
                }}
              >
                {h.text || "Untitled"}
              </span>
            )}
            <span
              style={{
                display: "block",
                flexShrink: 0,
                width: isActive ? 18 : 12,
                height: 2,
                borderRadius: 1,
                background: isActive ? "#2383e2" : colors.muted,
                opacity: isActive ? 1 : 0.45,
                transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}