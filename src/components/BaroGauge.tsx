import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MAX_M = 150;
const ARC = Math.PI * 50;

// Barometer dial from the prototype: the needle climbs to the height it
// measures (0 to 150 m) and settles. DEMO: the height is simulated.
export function BaroGauge({ metres, animate }: { metres: number; animate: boolean }) {
  const reduce = useReducedMotion();
  const target = Math.min(metres, MAX_M) / MAX_M;
  const k = useSharedValue(animate && !reduce ? 0 : target);

  useEffect(() => {
    if (!animate || reduce) {
      k.value = target;
      return;
    }
    k.value = withTiming(target, {
      duration: 1300,
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
    });
  }, [animate, reduce, target, k]);

  const needle = useAnimatedProps(() => {
    const a = Math.PI + Math.PI * k.value; // 180deg (left) to 360deg (right)
    return { x2: 60 + 38 * Math.cos(a), y2: 62 + 38 * Math.sin(a) };
  });
  const fill = useAnimatedProps(() => ({
    strokeDasharray: [ARC * k.value, 400],
  }));

  return (
    <Svg width={104} height={64} viewBox="0 0 120 74" importantForAccessibility="no-hide-descendants">
      <Path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke={colors.background} strokeWidth={10} strokeLinecap="round" />
      <AnimatedPath d="M10 62a50 50 0 0 1 100 0" fill="none" stroke={colors.ink} strokeWidth={10} strokeLinecap="round" animatedProps={fill} />
      {[0, 50, 100, 150].map((v) => {
        const r = ((-180 + (180 * v) / MAX_M) * Math.PI) / 180;
        return (
          <Line
            key={v}
            x1={60 + 40 * Math.cos(r)}
            y1={62 + 40 * Math.sin(r)}
            x2={60 + 34 * Math.cos(r)}
            y2={62 + 34 * Math.sin(r)}
            stroke={colors.inkMuted}
            strokeWidth={2}
          />
        );
      })}
      <AnimatedLine x1={60} y1={62} stroke={colors.alert} strokeWidth={4} strokeLinecap="round" animatedProps={needle} />
      <Circle cx={60} cy={62} r={6} fill={colors.ink} />
    </Svg>
  );
}
