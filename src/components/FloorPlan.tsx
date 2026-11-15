import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '@/constants/theme';

const NAVY = colors.ink;
const SLATE = colors.inkMuted;

// Level 22 plan (ported from the prototype). `route` draws your path to Stairwell B.
export function FloorPlan({ route }: { route?: boolean }) {
  return (
    <Svg
      viewBox="0 0 340 230"
      width="100%"
      height={undefined}
      style={{ aspectRatio: 340 / 230 }}
      accessibilityRole="image"
      accessibilityLabel="Level 22 floor plan. Stairwell A north-west, Stairwell B south-east with the waiting point beside it, Bomba lift lobby in the central core."
    >
      <Rect x={6} y={6} width={328} height={218} rx={14} fill="#F3F6F9" stroke={NAVY} strokeWidth={3} />
      <G stroke="#C9D4DF" strokeWidth={1.5}>
        {[60, 110, 230, 280].map((x) => (
          <G key={x}>
            <Line x1={x} y1={10} x2={x} y2={60} />
            <Line x1={x} y1={170} x2={x} y2={220} />
          </G>
        ))}
      </G>
      <SvgText x={34} y={40} fontSize={11} fill={SLATE}>Meeting</SvgText>
      <SvgText x={250} y={200} fontSize={11} fill={SLATE}>Pantry</SvgText>
      <Rect x={120} y={80} width={100} height={70} rx={8} fill="#E5ECF2" stroke={SLATE} strokeWidth={1.5} />
      <SvgText x={170} y={111} textAnchor="middle" fontSize={11} fill={SLATE}>Core</SvgText>
      <Rect x={145} y={120} width={50} height={22} rx={5} fill={SLATE} />
      <SvgText x={170} y={135} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fff">L Bomba</SvgText>
      <Rect x={16} y={66} width={44} height={44} rx={8} fill={NAVY} />
      <SvgText x={38} y={94} textAnchor="middle" fontSize={18} fontWeight="800" fill="#fff">A</SvgText>
      <Rect x={280} y={120} width={44} height={44} rx={8} fill={NAVY} />
      <SvgText x={302} y={148} textAnchor="middle" fontSize={18} fontWeight="800" fill="#fff">B</SvgText>
      {[
        [72, 66, 87, 86],
        [240, 126, 255, 146],
      ].map(([x, y, tx, ty]) => (
        <G key={x}>
          <Rect x={x} y={y} width={30} height={30} rx={7} fill="#fff" stroke={SLATE} strokeWidth={2} strokeDasharray="4 3" />
          <SvgText x={tx} y={ty} textAnchor="middle" fontSize={12} fontWeight="800" fill={SLATE}>C</SvgText>
        </G>
      ))}
      <G x={286} y={172}>
        <Circle cx={16} cy={16} r={16} fill={colors.alert} />
        <Path d="M16 25s-6-5-6-9.5a6 6 0 0 1 12 0C22 20 16 25 16 25z" fill="#fff" />
      </G>
      {route ? (
        <Path d="M90 190 C 150 200, 230 205, 290 190" fill="none" stroke={colors.alert} strokeWidth={4} strokeDasharray="2 8" strokeLinecap="round" />
      ) : null}
      <Circle cx={route ? 90 : 70} cy={190} r={9} fill={NAVY} stroke="#fff" strokeWidth={3} />
      <SvgText x={route ? 90 : 70} y={214} textAnchor="middle" fontSize={11} fontWeight="700" fill={NAVY}>You</SvgText>
    </Svg>
  );
}

export function SitePlan() {
  return (
    <Svg
      viewBox="0 0 340 230"
      width="100%"
      height={undefined}
      style={{ aspectRatio: 340 / 230 }}
      accessibilityRole="image"
      accessibilityLabel="Site plan. Assembly point A is on the front plaza, outside the main entrance of UOA Corporate Tower."
    >
      <Rect x={0} y={0} width={340} height={230} rx={10} fill="#F3F6F9" />
      <Rect x={0} y={150} width={340} height={30} fill="#E5ECF2" />
      <SvgText x={12} y={170} fontSize={11} fill={SLATE}>Jalan Kerinchi</SvgText>
      <Rect x={40} y={20} width={110} height={100} rx={8} fill={NAVY} />
      <SvgText x={95} y={64} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fff">UOA Corporate</SvgText>
      <SvgText x={95} y={79} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fff">Tower</SvgText>
      <Rect x={190} y={20} width={110} height={100} rx={8} fill="#22335A" opacity={0.55} />
      <SvgText x={245} y={72} textAnchor="middle" fontSize={11} fill="#fff">Tower B</SvgText>
      <Rect x={80} y={116} width={30} height={8} fill={colors.alert} />
      <Path d="M95 128 v12" stroke={NAVY} strokeWidth={3} strokeDasharray="3 4" />
      <Rect x={50} y={188} width={140} height={34} rx={10} fill="#DDF2E6" stroke={colors.success} strokeWidth={2.5} />
      <SvgText x={120} y={210} textAnchor="middle" fontSize={13} fontWeight="800" fill={colors.success}>Assembly point A</SvgText>
    </Svg>
  );
}
