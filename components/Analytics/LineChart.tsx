import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import TextMalet from '@/components/TextMalet/TextMalet';

interface LineChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  lineColor?: string;
  formatValue?: (value: number) => string;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

export default function LineChart({
  data,
  width: propWidth,
  height = 200,
  lineColor = '#1a1a1a',
  formatValue,
}: LineChartProps) {
  if (!data.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <TextMalet style={styles.emptyText}>Sin datos</TextMalet>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 28;
  const paddingBottom = 30;
  const innerHeight = height - paddingTop - paddingBottom;

  const chartWidth = propWidth ?? Math.max(data.length * 48 + paddingLeft + paddingRight, 300);
  const usableWidth = chartWidth - paddingLeft - paddingRight;

  const points = data.map((d, i) => ({
    x: paddingLeft + (data.length === 1 ? usableWidth / 2 : (i / (data.length - 1)) * usableWidth),
    y: paddingTop + innerHeight - ((d.value - minVal) / range) * innerHeight,
  }));

  const linePath = smoothPath(points);

  const hasPath = points.length >= 2;
  const fillPath = hasPath
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
    : '';

  const format = formatValue ?? ((v: number) => `$${v.toFixed(0)}`);

  const maxIndex = values.indexOf(maxVal);

  const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : Math.ceil(data.length / 7);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.6} />
            <Stop offset="0.5" stopColor={lineColor} stopOpacity={1} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0.6} />
          </LinearGradient>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.12} />
            <Stop offset="0.6" stopColor={lineColor} stopOpacity={0.04} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          return (
            <Line
              key={ratio}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="rgba(0,0,0,0.04)"
              strokeWidth={1}
            />
          );
        })}

        {/* Baseline */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + innerHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + innerHeight}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
        />

        {/* Area fill */}
        {hasPath && <Path d={fillPath} fill="url(#areaGrad)" />}

        {/* Line */}
        {hasPath && (
          <Path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Dots + labels */}
        {points.map((p, i) => {
          const isMax = i === maxIndex && maxVal > 0;
          const showLabel = i % labelStep === 0 || i === points.length - 1;

          return (
            <React.Fragment key={i}>
              {/* Dot */}
              <Circle
                cx={p.x}
                cy={p.y}
                r={isMax ? 4 : 2.5}
                fill={isMax ? lineColor : '#fff'}
                stroke={lineColor}
                strokeWidth={isMax ? 2 : 1.5}
              />

              {/* Max value label */}
              {isMax && (
                <SvgText
                  x={p.x}
                  y={p.y - 10}
                  fontSize={10}
                  fontWeight="700"
                  fill={lineColor}
                  textAnchor="middle"
                >
                  {format(maxVal)}
                </SvgText>
              )}

              {/* X-axis labels */}
              {showLabel && (
                <SvgText
                  x={p.x}
                  y={height - 8}
                  fontSize={9}
                  fill="rgba(0,0,0,0.3)"
                  textAnchor="middle"
                >
                  {data[i].label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'scroll',
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    width: '100%',
    minWidth: 280,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
  },
});
