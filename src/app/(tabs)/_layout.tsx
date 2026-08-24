import { Tabs } from 'expo-router';
import { BarChart3, House, Pill, Settings } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

const ICONS = {
  index: House,
  history: BarChart3,
  medicines: Pill,
  settings: Settings,
} as const;

export default function TabsLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const active = '#F0A47E'; // peach — tailwind.config.js
  const inactive = dark ? '#9B97AB' : '#8A8699';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: dark ? '#1C1B22' : '#FBF8F4',
          borderTopColor: dark ? '#35323F' : '#EFEAE2',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
                  ? 'Today'
                  : name === 'history'
                    ? 'History'
                    : name === 'medicines'
                      ? 'Medicines'
                      : 'Settings',
              tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}
