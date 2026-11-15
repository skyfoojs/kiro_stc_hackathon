import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = { color: string; glow: string; stroke?: number; cornerRadius?: number; lapMs?: number };

// LED strip around the screen edge with lights chasing clockwise.
// An SVG rect's outline starts at the top-left and runs clockwise, so moving the
// dash pattern forward (more negative offset) moves the lights clockwise.
export function LedBorder({ color, glow, stroke = 8, cornerRadius = 48, lapMs = 6000 }: Props) {
  const { width, height } = useWindowDimensions();
  const inset = stroke / 2;
  const w = width - stroke;
  const h = height - stroke;

  // Whole number of light+gap periods around the edge, so the loop is seamless.
  const perimeter = 2 * (w + h);
  const count = Math.max(12, Math.round(perimeter / 64));
  const period = perimeter / count;
  const dash = period * 0.55;

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = 0;
    // One period per step; ~lapMs for a full lap.
    offset.value = withRepeat(
      withTiming(-period, { duration: lapMs / count, easing: Easing.linear }),
      -1,
      false,
    );
  }, [offset, period, count, lapMs]);

  const lights = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        {/* Soft glow under the lights */}
        <AnimatedRect
          x={inset}
          y={inset}
          width={w}
          height={h}
          rx={cornerRadius}
          fill="none"
          stroke={glow}
          strokeWidth={stroke * 2.2}
          strokeOpacity={0.35}
          strokeDasharray={[dash, period - dash]}
          animatedProps={lights}
        />
        {/* Dim strip so the gaps still read as LEDs */}
        <Rect x={inset} y={inset} width={w} height={h} rx={cornerRadius} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
        {/* The lights */}
        <AnimatedRect
          x={inset}
          y={inset}
          width={w}
          height={h}
          rx={cornerRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={[dash, period - dash]}
          animatedProps={lights}
        />
      </Svg>
    </View>
  );
}
