import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

const COLORS = {
  background: '#064431',
  selected: '#ef6b2a',
  orange: '#FF7A00',
  unselected: '#AAB8B2',
};

export default function AppTabs() {
  const scheme = useColorScheme();

  return (
    <NativeTabs
      backgroundColor={COLORS.background}
      indicatorColor={COLORS.selected}
      labelStyle={{
        selected: {
          color: '#FFFFFF',
          fontWeight: '800',
        }
      }}
    >
      {/* Dashboard */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          Dashboard
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/dashboard.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* Orders */}
      <NativeTabs.Trigger name="createFoodItem">
        <NativeTabs.Trigger.Label>
          Upload Food
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/food.png')}
          renderingMode="template"
        />

      </NativeTabs.Trigger>
        <NativeTabs.Trigger name="createVariant">
        <NativeTabs.Trigger.Label>
          Upload Variant
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/food.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>


      {/* Kitchen */}
      <NativeTabs.Trigger name="addCategory">
        <NativeTabs.Trigger.Label>
          Add Category
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/category.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* Cash Counter */}
      <NativeTabs.Trigger name="stuff-list">
        <NativeTabs.Trigger.Label>
          Staff List
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/staff.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}