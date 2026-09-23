import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import TextMalet from '@/components/TextMalet/TextMalet';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
  formatValue?: (value: number) => string;
}

export default function BarChart({
  data,
  height = 200,
  barColor = '#1e88e5',
  formatValue,
}: BarChartProps) {
  if (!data.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <TextMalet style={styles.emptyText}>Sin datos</TextMalet>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const maxIndex = data.findIndex((d) => d.value === maxVal);

  const barWidth = 24;
  const barGap = 12;
  const paddingHorizontal = 20;
  const chartWidth = Math.max(data.length * (barWidth + barGap) + barGap + paddingHorizontal * 2, 300);
  const innerHeight = height - 36;

  const format = formatValue ?? ((v: number) => `$${v.toFixed(0)}`);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a1a" stopOpacity={1} />
            <Stop offset="1" stopColor="#1a1a1a" stopOpacity={0.25} />
          </LinearGradient>
          <LinearGradient id="barGradientHighlight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={1} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.5} />
          </LinearGradient>
        </Defs>

        {/* Minimal grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <Line
            key={ratio}
            x1={paddingHorizontal}
            y1={innerHeight * (1 - ratio)}
            x2={chartWidth - paddingHorizontal}
            y2={innerHeight * (1 - ratio)}
            stroke="rgba(0,0,0,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Baseline */}
        <Line
          x1={paddingHorizontal}
          y1={innerHeight}
          x2={chartWidth - paddingHorizontal}
          y2={innerHeight}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
        />

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / maxVal) * innerHeight * 0.85, 4);
          const x = paddingHorizontal + barGap + i * (barWidth + barGap);
          const y = innerHeight - barHeight;
          const isMax = i === maxIndex && d.value > 0;

          return (
            <React.Fragment key={i}>
              {/* Bar with rounded top */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                ry={6}
                fill={isMax ? 'url(#barGradientHighlight)' : 'url(#barGradient)'}
              />

              {/* Max indicator dot */}
              {isMax && (
                <Circle
                  cx={x + barWidth / 2}
                  cy={y - 8}
                  r={3}
                  fill="#1a1a1a"
                />
              )}

              {/* Value label - only for max */}
              {isMax && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 18}
                  fontSize={10}
                  fontWeight="600"
                  fill="#1a1a1a"
                  textAnchor="middle"
                >
                  {format(d.value)}
                </SvgText>
              )}

              {/* Date label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 6}
                fontSize={9}
                fill="rgba(0,0,0,0.3)"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
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
