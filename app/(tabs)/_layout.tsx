import { useColors } from "@/hooks/useColors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} {...props} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom || 4,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: "Log Mood",
          tabBarIcon: ({ color }) => <TabIcon name='heart' color={color} />,
          headerTitle: "How are you feeling?",
        }}
      />
      <Tabs.Screen
        name='history'
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <TabIcon name='list' color={color} />,
          headerTitle: "Your Entries",
        }}
      />
      <Tabs.Screen
        name='trends'
        options={{
          title: "Trends",
          tabBarIcon: ({ color }) => <TabIcon name='bar-chart' color={color} />,
          headerTitle: "Your Trends",
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name='cog' color={color} />,
          headerTitle: "Settings",
        }}
      />
    </Tabs>
  );
}
