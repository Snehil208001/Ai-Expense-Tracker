import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { ExpenseListScreen } from '../screens/ExpenseListScreen';
import { ScanReceiptScreen } from '../screens/ScanReceiptScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { colors, fontSize } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: () => null }}
      />
      <Tab.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ tabBarLabel: 'Expenses', tabBarIcon: () => null }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanReceiptScreen}
        options={{ tabBarLabel: 'Scan', tabBarIcon: () => null }}
      />
      <Tab.Screen
        name="Analytics"
        component={() => <PlaceholderScreen route={{ name: 'Analytics' }} />}
        options={{ tabBarLabel: 'Analytics', tabBarIcon: () => null }}
      />
      <Tab.Screen
        name="Profile"
        component={() => <PlaceholderScreen route={{ name: 'Profile' }} />}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => null }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundCard },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{
            title: 'Add Expense',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
