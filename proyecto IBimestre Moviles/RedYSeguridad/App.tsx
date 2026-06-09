import React from 'react';
import {StatusBar, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RedScreen from './src/screens/RedScreen';
import BovedaScreen from './src/screens/BovedaScreen';

type TabParamList = {
  Red: undefined;
  Boveda: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#4FC3F7',
            tabBarInactiveTintColor: '#8888AA',
            tabBarStyle: {
              backgroundColor: '#16213E',
              borderTopColor: '#0F3460',
              borderTopWidth: 1,
            },
            headerStyle: {backgroundColor: '#1A1A2E'},
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
          }}>
          <Tab.Screen
            name="Red"
            component={RedScreen}
            options={{
              title: 'Red (REST)',
              tabBarLabel: 'Red (REST)',
              tabBarIcon: ({color}: {color: string}) => (
                <Text style={{color, fontSize: 20}}>📡</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Boveda"
            component={BovedaScreen}
            options={{
              title: 'Bóveda',
              tabBarLabel: 'Bóveda',
              tabBarIcon: ({color}: {color: string}) => (
                <Text style={{color, fontSize: 20}}>🔐</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
