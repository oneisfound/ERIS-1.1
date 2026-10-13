import { PAGE_COLORS } from "../../data/pageColors";

export default function PageColorPicker({ activeColor, colors, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, padding: 4 }}>
      {PAGE_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => onPick(c.id)}
          title={c.name}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: activeColor === c.id ? `2px solid ${colors.text}` : `1px solid ${colors.border}`,
            background: c.light,
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}