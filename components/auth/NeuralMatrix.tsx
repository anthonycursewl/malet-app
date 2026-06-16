import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const SIZE = 4;
const DOT_SIZE = 6;
const DOT_GAP = 5;

const ACTIVE_COLOR = '#0e0e0e';
const INACTIVE_OPACITY = 0.1;
const ACTIVE_OPACITY = 0.7;

const isCorner = (row: number, col: number) =>
  (row === 0 || row === SIZE - 1) && (col === 0 || col === SIZE - 1);

const indexOf = (row: number, col: number) => row * SIZE + col;

type Coord = [number, number];

const PATTERNS: Coord[][] = [
  [[0,1], [0,2], [1,0], [1,3], [2,0], [2,3], [3,1], [3,2]],
  [[1,1], [1,2], [2,1], [2,2]],
  [[0,1], [1,0], [2,3], [3,2], [1,0], [2,3], [0,1]],
  [[0,2], [1,3], [2,0], [3,1]],
  [[0,1], [0,2], [3,1], [3,2]],
  [[1,0], [2,0], [1,3], [2,3]],
  [[1,1], [1,2], [2,1], [2,2], [0,1], [0,2], [3,1], [3,2]],
  [[0,1], [1,1], [2,1], [3,1], [0,3]],
  [[0,2], [1,2], [2,2], [3,2]],
  [[1,0], [1,1], [1,2], [1,3]],
  [[2,0], [2,1], [2,2], [2,3]],
];

const fireDot = (value: Animated.Value) => {
  Animated.sequence([
    Animated.timing(value, {
      toValue: ACTIVE_OPACITY,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.delay(200 + Math.random() * 300),
    Animated.timing(value, {
      toValue: INACTIVE_OPACITY,
      duration: 500 + Math.random() * 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
};

const NeuralMatrix = () => {
  const dotOpacitiesRef = useRef<Animated.Value[] | null>(null);
  if (!dotOpacitiesRef.current) {
    dotOpacitiesRef.current = Array.from(
      { length: SIZE * SIZE },
      () => new Animated.Value(INACTIVE_OPACITY)
    );
  }
  const values = dotOpacitiesRef.current;

  useEffect(() => {
    let step = 0;
    const tick = () => {
      const pattern = PATTERNS[step % PATTERNS.length];
      pattern.forEach(([r, c], i) => {
        setTimeout(() => fireDot(values[indexOf(r, c)]), i * 60);
      });
      step++;
    };

    tick();
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, [values]);

  return (
    <View style={styles.grid}>
      {Array.from({ length: SIZE }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: SIZE }).map((_, col) => {
            if (isCorner(row, col)) return <View key={col} style={styles.empty} />;
            const index = indexOf(row, col);
            return (
              <Animated.View
                key={col}
                style={[
                  styles.dot,
                  {
                    opacity: values[index],
                    backgroundColor: ACTIVE_COLOR,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: DOT_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: DOT_GAP,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 4,
  },
  empty: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
});

export default NeuralMatrix;
