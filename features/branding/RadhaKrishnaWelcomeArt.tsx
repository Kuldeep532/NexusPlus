import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export function RadhaKrishnaWelcomeArt({ width = 320, height = 260 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 260" accessibilityRole="image" accessibilityLabel="Stylized Radha and Krishna devotional artwork">
      <Circle cx="160" cy="128" r="118" fill="#FEF3C7" opacity={0.42} />
      <Path d="M42 214c30-22 55-32 89-32 34 0 57 10 88 32H42Z" fill="#86EFAC" opacity={0.75} />
      <Path d="M178 214c29-22 58-33 93-33 12 0 22 2 31 5v28h-124Z" fill="#4ADE80" opacity={0.72} />
      <Ellipse cx="141" cy="98" rx="30" ry="39" fill="#8B5E3C" />
      <Path d="M112 81c8-34 24-51 47-51 21 0 39 18 44 45-12-10-28-16-46-16-18 0-33 7-45 22Z" fill="#F59E0B" />
      <Path d="M114 71c12-19 27-30 45-30 21 0 38 11 51 32-12-5-25-8-38-8-21 0-40 7-58 21Z" fill="#7C3AED" opacity={0.92} />
      <Circle cx="132" cy="100" r="3" fill="#1F2937" />
      <Circle cx="151" cy="100" r="3" fill="#1F2937" />
      <Path d="M135 118c8 6 15 6 22 0" fill="none" stroke="#5B3A29" strokeWidth="2" strokeLinecap="round" />
      <Path d="M177 79c10 5 19 10 28 10" fill="none" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
      <Ellipse cx="211" cy="105" rx="24" ry="34" fill="#B86F52" />
      <Path d="M189 91c7-27 22-42 43-42 18 0 34 14 39 36-11-7-24-11-39-11-17 0-31 6-43 17Z" fill="#EC4899" />
      <Path d="M190 81c10-18 25-28 43-28 18 0 31 9 41 26-11-4-23-6-35-6-18 0-33 4-49 8Z" fill="#F9A8D4" opacity={0.9} />
      <Circle cx="204" cy="104" r="3" fill="#1F2937" />
      <Circle cx="219" cy="104" r="3" fill="#1F2937" />
      <Path d="M205 119c7 5 13 5 18 0" fill="none" stroke="#7C4A3A" strokeWidth="2" strokeLinecap="round" />
      <Path d="M82 190c12-16 21-22 33-28 8 17 17 28 27 38-22 0-41-4-60-10Z" fill="#F59E0B" opacity={0.75} />
      <Path d="M218 172c13-14 24-21 39-27 3 13 10 24 19 34-20 2-38 0-58-7Z" fill="#7C3AED" opacity={0.76} />
      <Circle cx="275" cy="53" r="3" fill="#FDE68A" />
      <Circle cx="55" cy="68" r="4" fill="#FDE68A" />
    </Svg>
  );
}
