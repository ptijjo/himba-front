import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { himbaColors } from '@/constants/theme';
import type { RepeatMode } from '@/store/slices/playerSlice';

type IconProps = {
  color?: string;
  size?: number;
};

/** Icônes lecteur — trait fin style maquette (shuffle / prev / play / next / repeat). */
export function ShuffleIcon({
  color = himbaColors.ink,
  size = 22,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3h5v5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20 20 4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 21h5v-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 15l5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M4 4l5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PreviousIcon({
  color = himbaColors.ink,
  size = 22,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4v16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M19 4 7 12l12 8V4z" fill={color} />
    </Svg>
  );
}

export function NextIcon({ color = himbaColors.ink, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4v16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M5 4l12 8-12 8V4z" fill={color} />
    </Svg>
  );
}

export function PlayIcon({ color = himbaColors.ink, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l12-7L8 5z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ color = himbaColors.ink, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={5} width={4} height={14} rx={1.2} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1.2} fill={color} />
    </Svg>
  );
}

export function RepeatIcon({
  color = himbaColors.ink,
  size = 22,
  mode = 'all',
}: IconProps & { mode?: Exclude<RepeatMode, 'off'> }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 2l4 4-4 4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12V8a4 4 0 0 1 4-4h14"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 22l-4-4 4-4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12v4a4 4 0 0 1-4 4H3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mode === 'one' ? (
        <SvgText
          x="12"
          y="14.5"
          fill={color}
          fontSize="9"
          fontWeight="700"
          textAnchor="middle"
        >
          1
        </SvgText>
      ) : null}
    </Svg>
  );
}
