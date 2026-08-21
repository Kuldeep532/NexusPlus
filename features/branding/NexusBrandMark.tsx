import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export function NexusBrandMark({ size = 96 }: { size?: number }) {
  const scale = size / 96;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityRole="image" accessibilityLabel="Nexus Plus devotional brand mark">
      <Defs>
        <LinearGradient id="nexusMark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7C3AED" />
          <Stop offset="0.55" stopColor="#EC4899" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Circle cx="48" cy="48" r="44" fill="#FFF7ED" stroke="#F59E0B" strokeWidth={2 / scale} />
      <Path d="M48 17c7 9 11 17 11 25 0 12-8 22-11 27-3-5-11-15-11-27 0-8 4-16 11-25Z" fill="url(#nexusMark)" />
      <Path d="M21 58c7-8 17-12 27-12 10 0 20 4 27 12-10-3-19-4-27-4s-17 1-27 4Z" fill="#FDE68A" />
      <Path d="M29 70c6-4 12-5 19-5 7 0 13 1 19 5-9 7-29 7-38 0Z" fill="#7C3AED" opacity={0.9} />
      <Circle cx="44" cy="37" r="2.5" fill="#FFF" />
      <Circle cx="52" cy="37" r="2.5" fill="#FFF" />
    </Svg>
  );
}
