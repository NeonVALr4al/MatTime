type Point = { label: string; value: number };

type Props = {
  data: Point[];
  size?: number;
};

const RINGS = [0.25, 0.5, 0.75, 1];

export default function RadarChart({ data, size = 260 }: Props) {
  const center = size / 2;
  const radius = size / 2 - 74;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const angleStep = (2 * Math.PI) / data.length;

  const pointAt = (i: number, ratio: number): [number, number] => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = radius * ratio;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const polygon = (ratio: (i: number) => number) =>
    data.map((_, i) => pointAt(i, ratio(i)).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      {RINGS.map((r) => (
        <polygon key={r} points={polygon(() => r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}

      {data.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
      })}

      <polygon
        points={polygon((i) => data[i].value / maxValue)}
        fill="rgba(255,46,85,0.25)"
        stroke="#ff2e55"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const [x, y] = pointAt(i, data[i].value / maxValue);
        return <circle key={`pt-${d.label}`} cx={x} cy={y} r={2.5} fill="#ff2e55" />;
      })}

      {data.map((d, i) => {
        const [x, y] = pointAt(i, 1.05);
        const dx = x - center;
        const dy = y - center;
        const anchor = Math.abs(dx) < 4 ? 'middle' : dx > 0 ? 'start' : 'end';
        const baseline = Math.abs(dy) < 4 ? 'middle' : dy > 0 ? 'hanging' : 'auto';
        return (
          <text
            key={d.label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline={baseline}
            fontSize={9}
            fontWeight={700}
            fill="#c1c2c7"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
