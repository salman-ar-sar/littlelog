import { Tabs } from 'expo-router';
import { BarChart3, ChartLine, House, Settings } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

const ICONS = {
  index: House,
  history: ChartLine,
  trends: BarChart3,
  settings: Settings,
} as const;

export default function TabsLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const active = '#C05B33'; // terracotta — tailwind.config.js
  const inactive = dark ? '#9C937F' : '#8A8073';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: dark ? '#1B1916' : '#F6F1E7',
          borderTopColor: dark ? '#38332B' : '#E7E0D2',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', fontFamily: 'Manrope_600SemiBold' },
      }}
    >
      {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((name) => {
        const Icon = ICONS[name];
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              tabBarLabel:
                name === 'index'
                  ? 'Home'
                  : name === 'history'
                    ? 'History'
                    : name === 'trends'
                      ? 'Trends'
                      : 'Settings',
              tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
            }}
          />
        );
      })}
      {/* Medicines management stays reachable from the header bell + Settings */}
      <Tabs.Screen name="medicines" options={{ href: null }} />
    </Tabs>
  );
}
