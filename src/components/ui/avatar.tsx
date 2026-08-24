import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface AvatarProps {
  uri?: string;
  name: string;
  /** Diameter in px. */
  size?: number;
}

// Hex values copied from tailwind.config.js theme.extend.colors (DEFAULT shades).
const PALETTE = [
  '#F2A7B3', // blush
  '#F0A47E', // peach
  '#79C4A4', // mint
  '#82B4DC', // sky
  '#EFC368', // butter
  '#A99BD8', // lavender
] as const;

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <View
        className="overflow-hidden border border-line dark:border-[#38332B]"
        style={style}
      >
        <Image source={{ uri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }
  const initials = initialsOf(name);
  const bg = PALETTE[hashString(name) % PALETTE.length];
  return (
    <View
      accessibilityLabel={`${name} avatar`}
      className="items-center justify-center border border-line dark:border-[#38332B]"
      style={[style, { backgroundColor: bg }]}
    >
      <Text style={{ fontSize: size * 0.38 }} className="font-bold text-white">
        {initials}
      </Text>
    </View>
  );
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
