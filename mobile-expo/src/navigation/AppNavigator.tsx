import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import {
  LoginScreen,
  SignupScreen,
  DashboardScreen,
  AddExpenseScreen,
  ExpenseListScreen,
  EditExpenseScreen,
  ScanReceiptScreen,
  AnalyticsScreen,
  ProfileScreen,
  AIChatScreen,
  CategoriesScreen,
} from '../screens';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fontSize, fontWeight } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const { colors } = useTheme();
  const icons: Record<string, string> = {
    Home: '🏠',
    Add: '➕',
    Scan: '📷',
    Analytics: '📊',
    Profile: '👤',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{icons[label] || '•'}</Text>
      <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.textMuted }, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Add" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Scan" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Analytics" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, ready } = useAuth();

  if (!ready || loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ExpenseList"
              component={ExpenseListScreen}
              options={{ headerShown: true, headerTitle: 'All Expenses' }}
            />
            <Stack.Screen
              name="EditExpense"
              component={EditExpenseScreen}
              options={{ headerShown: true, headerTitle: 'Edit Expense' }}
            />
            <Stack.Screen
              name="AIChat"
              component={AIChatScreen}
              options={{ headerShown: true, headerTitle: 'AI Assistant' }}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ headerShown: false }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { borderTopWidth: 1, paddingTop: 8, height: 70 },
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  tabEmoji: { fontSize: 22, marginBottom: 2 },
  tabLabel: { fontSize: 10 },
  tabLabelActive: { fontWeight: fontWeight.semiBold },
});
