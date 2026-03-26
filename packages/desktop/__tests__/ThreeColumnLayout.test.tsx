import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {ThreeColumnLayout} from '../src/components/ThreeColumnLayout';
import {Text} from 'react-native';

describe('ThreeColumnLayout', () => {
  const mockSidebar = <Text testID="sidebar-content">Sidebar</Text>;
  const mockList = <Text testID="list-content">List</Text>;
  const mockDetail = <Text testID="detail-content">Detail</Text>;

  it('renders all three columns', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
      />,
    );

    expect(screen.getByTestId('three-column-layout')).toBeTruthy();
    expect(screen.getByTestId('sidebar-column')).toBeTruthy();
    expect(screen.getByTestId('list-column')).toBeTruthy();
    expect(screen.getByTestId('detail-column')).toBeTruthy();
  });

  it('renders sidebar content', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
      />,
    );

    expect(screen.getByTestId('sidebar-content')).toBeTruthy();
    expect(screen.getByText('Sidebar')).toBeTruthy();
  });

  it('renders list content', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
      />,
    );

    expect(screen.getByTestId('list-content')).toBeTruthy();
    expect(screen.getByText('List')).toBeTruthy();
  });

  it('renders detail content', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
      />,
    );

    expect(screen.getByTestId('detail-content')).toBeTruthy();
    expect(screen.getByText('Detail')).toBeTruthy();
  });

  it('uses default column widths', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
      />,
    );

    const sidebarColumn = screen.getByTestId('sidebar-column');
    const listColumn = screen.getByTestId('list-column');

    expect(sidebarColumn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({width: 160})]),
    );
    expect(listColumn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({width: 200})]),
    );
  });

  it('accepts custom column widths', () => {
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
        sidebarWidth={200}
        listWidth={250}
      />,
    );

    const sidebarColumn = screen.getByTestId('sidebar-column');
    const listColumn = screen.getByTestId('list-column');

    expect(sidebarColumn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({width: 200})]),
    );
    expect(listColumn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({width: 250})]),
    );
  });

  it('accepts custom style prop', () => {
    const customStyle = {backgroundColor: '#ff0000'};
    render(
      <ThreeColumnLayout
        sidebar={mockSidebar}
        list={mockList}
        detail={mockDetail}
        style={customStyle}
      />,
    );

    const layout = screen.getByTestId('three-column-layout');
    expect(layout.props.style).toBeDefined();
  });
});
