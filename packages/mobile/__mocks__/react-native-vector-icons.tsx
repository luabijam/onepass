import React from 'react';
import { View, Text } from 'react-native';

type MockIconProps = {
  name: string;
  size?: number;
  color?: string;
  testID?: string;
};

const MockIcon = ({ name, testID }: MockIconProps) => {
  return (
    <View testID={testID || `icon-${name}`}>
      <Text>{name}</Text>
    </View>
  );
};

export default MockIcon;
