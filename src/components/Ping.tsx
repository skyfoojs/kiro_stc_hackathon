import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Ping, the Relay mascot (ported from docs/appname-customer.html).
// Full body on calm screens; the compact badge during an incident.

const PC = { shell: '#F8FAFC', slate: '#1E293B', amber: '#F59E0B', glow: '#FBBF24', edge: '#CBD5E1' };
const STATE = { standby: '#2563EB', alert: '#F59E0B', safe: '#10B981' } as const;

export type PingState = keyof typeof STATE;
export type PingPose = 'stand' | 'wave' | 'seated' | 'jump' | 'mug';
type Eyes = 'open' | 'happy' | 'joy' | 'calm';

function EyeLine({ d, w = 3.4 }: { d: string; w?: number }) {
  return <Path d={d} fill="none" stroke={PC.glow} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

function EyesFor({ kind }: { kind: Eyes }) {
  switch (kind) {
    case 'happy':
      return (
        <>
          <EyeLine d="M59 96q7-11 14 0" w={4} />
          <EyeLine d="M87 96q7-11 14 0" w={4} />
          <EyeLine d="M70 105q10 8 20 0" />
        </>
      );
    case 'joy':
      return (
        <>
          <EyeLine d="M59 96q7-11 14 0" w={4} />
          <EyeLine d="M87 96q7-11 14 0" w={4} />
          <Path d="M68 103q12 16 24 0z" fill={PC.glow} />
        </>
      );
    case 'calm':
      return (
        <>
          <EyeLine d="M59 93q7 8 14 0" w={4} />
          <EyeLine d="M87 93q7 8 14 0" w={4} />
          <EyeLine d="M72 106q8 4 16 0" />
        </>
      );
    default:
      return (
        <>
          <Ellipse cx={66} cy={93} rx={5.5} ry={7} fill={PC.glow} />
          <Ellipse cx={94} cy={93} rx={5.5} ry={7} fill={PC.glow} />
          <EyeLine d="M71 106q9 7 18 0" />
        </>
      );
  }
}

function Core({ eyes, ring }: { eyes: Eyes; ring: string }) {
  return (
    <>
      <G>
        <Path d="M62 -2L76 50M98 -2L84 50" stroke={PC.amber} strokeWidth={8} fill="none" />
        <Rect x={73} y={44} width={14} height={10} rx={3} fill={PC.edge} />
      </G>
      <Circle cx={80} cy={100} r={57} fill="none" stroke={ring} strokeOpacity={0.22} strokeWidth={7} />
      <Circle cx={80} cy={100} r={52} fill={PC.shell} stroke={ring} strokeWidth={5} />
      <Circle cx={80} cy={100} r={45} fill="none" stroke="#E2E8F0" strokeWidth={1.5} />
      <Rect x={46} y={72} width={68} height={44} rx={22} fill={PC.slate} />
      <EyesFor kind={eyes} />
    </>
  );
}

const Arm = ({ d }: { d: string }) => <Path d={d} fill="none" stroke={PC.slate} strokeWidth={6.5} strokeLinecap="round" />;
const Leg = ({ d }: { d: string }) => <Path d={d} fill="none" stroke={PC.slate} strokeWidth={7} strokeLinecap="round" />;
const Hand = ({ x, y }: { x: number; y: number }) => <Circle cx={x} cy={y} r={7.5} fill="#fff" stroke={PC.edge} strokeWidth={1.8} />;
function Shoe({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <G rotation={r} origin={`${x + 12}, ${y + 6}`}>
      <Rect x={x} y={y} width={24} height={12} rx={6} fill={PC.slate} />
      <Rect x={x + 1} y={y + 8} width={22} height={4} rx={2} fill="#fff" />
    </G>
  );
}

function StandLegs() {
  return (
    <>
      <Leg d="M66 148V178" />
      <Leg d="M94 148V178" />
      <Shoe x={54} y={176} />
      <Shoe x={82} y={176} />
    </>
  );
}

// Legs go under the body, arms on top of it (same order as the prototype).
function poseParts(pose: PingPose): { legs: ReactNode; arms: ReactNode } {
  switch (pose) {
    case 'wave':
      return {
        legs: <StandLegs />,
        arms: (
          <>
            <Rect x={3} y={132} width={26} height={32} rx={3} fill="#fff" stroke={PC.edge} strokeWidth={2} />
            <G fill={PC.slate}>
              <Rect x={7} y={136} width={8} height={8} rx={1} />
              <Rect x={17} y={136} width={8} height={8} rx={1} />
              <Rect x={7} y={146} width={8} height={8} rx={1} />
              <Rect x={18} y={148} width={4} height={4} />
              <Rect x={23} y={154} width={3} height={3} />
            </G>
            <Arm d="M30 106Q20 122 26 136" />
            <Hand x={26} y={138} />
            <Arm d="M130 106Q152 98 152 76" />
            <Hand x={152} y={70} />
          </>
        ),
      };
    case 'seated':
      return {
        legs: (
          <>
            <Leg d="M66 148Q62 170 90 174" />
            <Leg d="M94 148Q98 170 70 176" />
            <Shoe x={80} y={168} />
            <Shoe x={58} y={170} />
          </>
        ),
        arms: (
          <>
            <Arm d="M30 106Q30 140 74 150" />
            <Arm d="M130 106Q130 140 86 150" />
            <Hand x={75} y={150} />
            <Hand x={85} y={150} />
          </>
        ),
      };
    case 'jump':
      return {
        legs: (
          <>
            <Leg d="M68 148L56 166" />
            <Leg d="M92 148L104 166" />
            <Shoe x={44} y={162} r={-18} />
            <Shoe x={92} y={162} r={18} />
          </>
        ),
        arms: (
          <>
            <Arm d="M30 104Q6 94 10 62" />
            <Hand x={10} y={58} />
            <Arm d="M130 104Q154 94 150 62" />
            <Hand x={150} y={58} />
          </>
        ),
      };
    case 'mug':
      return {
        legs: <StandLegs />,
        arms: (
          <>
            <Rect x={24} y={124} width={26} height={24} rx={5} fill="#fff" stroke={PC.edge} strokeWidth={2} />
            <Path d="M50 130h4q6 0 6 7t-6 7h-4" fill="none" stroke={PC.edge} strokeWidth={3.2} />
            <Rect x={24} y={130} width={26} height={6} fill={PC.amber} />
            <Arm d="M30 106Q22 124 30 138" />
            <Hand x={32} y={140} />
            <Arm d="M130 106Q140 124 136 142" />
            <Hand x={136} y={144} />
            <Circle cx={148} cy={124} r={14} fill="#10B981" />
            <Path d="M141 124l5 5 9-10" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ),
      };
    default:
      return {
        legs: <StandLegs />,
        arms: (
          <>
            <Arm d="M30 106Q20 124 24 142" />
            <Hand x={24} y={144} />
            <Arm d="M130 106Q140 124 136 142" />
            <Hand x={136} y={144} />
          </>
        ),
      };
  }
}

const POSE_EYES: Record<PingPose, Eyes> = { stand: 'open', wave: 'happy', seated: 'calm', jump: 'joy', mug: 'calm' };

type PingProps = { pose?: PingPose; state?: PingState; size?: number };

export function Ping({ pose = 'stand', state = 'standby', size = 120 }: PingProps) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  const ring = STATE[state];
  const parts = poseParts(pose);

  useEffect(() => {
    if (reduce) return;
    const lift = pose === 'jump' ? -14 : -3;
    const ms = pose === 'jump' ? 600 : 1700;
    y.value = withRepeat(
      withSequence(withTiming(lift, { duration: ms, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: ms, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
  }, [pose, reduce, y]);

  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <View style={{ width: Math.round(size * 1.04), height: size }} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ flex: 1 }, bob]}>
        <Svg viewBox="-24 0 208 200" width="100%" height="100%">
          {pose === 'jump' ? <Ellipse cx={80} cy={190} rx={22} ry={4} fill={PC.slate} opacity={0.12} /> : null}
          <G fill="none" stroke={ring} strokeWidth={2}>
            <Ellipse cx={80} cy={190} rx={34} ry={6} opacity={0.55} />
            <Ellipse cx={80} cy={190} rx={52} ry={9} opacity={0.35} />
            <Ellipse cx={80} cy={190} rx={70} ry={12} opacity={0.18} />
          </G>
          {parts.legs}
          <Core eyes={POSE_EYES[pose]} ring={ring} />
          {parts.arms}
        </Svg>
      </Animated.View>
    </View>
  );
}

// Compact badge: visor, ring and lanyard. Used as the logo and during incidents.
export function PingBust({ state = 'standby', size = 44 }: { state?: PingState; size?: number }) {
  return (
    <View style={{ width: Math.round((size * 120) / 158), height: size }} importantForAccessibility="no-hide-descendants">
      <Svg viewBox="20 6 120 158" width="100%" height="100%">
        <Core eyes="open" ring={STATE[state]} />
      </Svg>
    </View>
  );
}
