import React, { Component } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, ListRenderItemInfo, GestureResponderEvent, TextStyle } from 'react-native';
import { TreeItem, TreeSelectProps } from '../..';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  textName: {
    fontSize: 16,
    marginLeft: 5
  },
  contentContainer: {
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  collapseIcon: {
    width: 0,
    height: 0,
    marginRight: 2,
    borderStyle: 'solid',
  }
});

type OnEventType = { e: GestureResponderEvent, item: TreeItem }

type StateType = {
  expansionStatus: Map<string, boolean>
  selectionStatus: Map<string, boolean>
}
export default class TreeSelect extends Component<TreeSelectProps, StateType> {
  private routes: Omit<TreeItem, "children">[]
  constructor(props: TreeSelectProps) {
    super(props);
    this.routes = [];
    this.state = {
      expansionStatus: new Map(),
      selectionStatus: new Map()
    };

    this.#initExpansionStatus()
    this.#initSelectionStatus()

  }

  #initSelectionStatus = () => {
    const { getIdSelection } = this.props
    if (getIdSelection) {
      getIdSelection()
        .then(map => {
          this.setState(state => {
            return { selectionStatus: map }
          })
        })
    }
  };

  #initExpansionStatus = () => {
    const { getOpenIds } = this.props;
    (getOpenIds === undefined? Promise.resolve([]): getOpenIds())
      .then(openIds => {
        const map = openIds.reduce((map, id) => (map.set(id, true), map), new Map())
        this.setState((state) => {
          return { expansionStatus: map }
        })
      })
  };

  _onPressNode = ({ item }: OnEventType) => { // eslint-disable-line
    const { getId } = this.props
    this.setState((state) => {
      const { selectionStatus } = state
      const id = getId(item)
      if (selectionStatus.has(id)) {
        /* let's find out if we can delete the status */
        const isSelected = selectionStatus.get(id)
        const isParentSelected = this.getSelectedStatus(item.parent)
        if (isSelected != isParentSelected) {
          selectionStatus.delete(id)
        } else {
          selectionStatus.set(id, isSelected? false: true)
        }
      } else {
        const isSelected = this.getSelectedStatus(item)
        selectionStatus.set(id, isSelected ? false : true)
      }
      return { selectionStatus }
    });
  };

  /**
   * changes the opened/closed status of the node
   * @param param0 
   */
  _onPressCollapse = ({ e, item }: OnEventType) => { // eslint-disable-line
    e.stopPropagation();
    const { getId } = this.props;
    this.setState((state) => {
      const nodesStatus = new Map(state.expansionStatus);
      nodesStatus.set(getId(item), !nodesStatus.get(getId(item))); // toggle
      if (nodesStatus.get(getId(item))) {
        /* prefetch the children as we are shortly going to display them */
        this.props.getChildren(item)
      }

      return { expansionStatus: nodesStatus }
    });
  };

  _renderTreeNodeIcon = (isOpen: boolean) => {
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle } = this.props;
    const collapseIcon = isOpen ? {
      borderRightWidth: 5,
      borderRightColor: 'transparent',
      borderLeftWidth: 5,
      borderLeftColor: 'transparent',
      borderTopWidth: 10,
      borderTopColor: 'black',
    } : {
      borderBottomWidth: 5,
      borderBottomColor: 'transparent',
      borderTopWidth: 5,
      borderTopColor: 'transparent',
      borderLeftWidth: 10,
      borderLeftColor: 'black',
    };
    const openIcon = treeNodeStyle && treeNodeStyle.openIcon;
    const closeIcon = treeNodeStyle && treeNodeStyle.closeIcon;

    return openIcon && closeIcon ? <View>{isOpen ? openIcon : closeIcon}</View> :
      <View style={[styles.collapseIcon, collapseIcon]} />;
  };

  _keyExtractor = (item: TreeItem, i: number) => this.props.getId(item);

  componentWillUnmount() {
    const { setIdSelection } = this.props
    if (setIdSelection !== undefined) {
      setIdSelection(this.state.selectionStatus)
    }
  }

  getSelectedStatus(node: TreeItem) {
    const { selectionStatus } = this.state;
    while (node != undefined) {
      let id = this.props.getId(node)
      if (selectionStatus.has(id)) {
        return selectionStatus.get(id)
      }
      node = node.parent
    }

    return undefined
  }

  _renderRow = ({ item }: ListRenderItemInfo<TreeItem>) => {
    const { isShowTreeId = false, selectedItemStyle, itemStyle, leafCanBeSelected, renderRow, getId, getChildren } = this.props;
    const { backgroundColor, fontSize, color } = itemStyle && itemStyle as TextStyle || {};

    const selectedItemStyleTS = selectedItemStyle as TextStyle
    const selectedBackgroundColor = selectedItemStyleTS?.backgroundColor;
    const selectedFontSize = selectedItemStyleTS?.fontSize;
    const selectedColor = selectedItemStyleTS?.color;

    let isSelected = this.getSelectedStatus(item)

    if (item.type === 'folder') {
      let children = getChildren(item)
      const isOpen = this.state.expansionStatus.get(getId(item)) || false;
      return (
        <View>
          <TouchableOpacity onPress={(e) => this._onPressNode({ e, item })} >
            <View style={{
              flexDirection: 'row',
              backgroundColor: !leafCanBeSelected && isSelected ? selectedBackgroundColor || '#fff' : backgroundColor || '#fff',
              marginBottom: 2,
              height: 24,
              alignItems: 'center'
            }}
            >
              <TouchableOpacity onPress={(e) => this._onPressCollapse({ e, item })}>{this._renderTreeNodeIcon(isOpen)}</TouchableOpacity>
              {
                isShowTreeId && <Text style={{ fontSize: 16, marginLeft: 4 }}>{getId(item)}</Text>
              }

              {renderRow ? renderRow(item) : <Text style={[styles.textName, !leafCanBeSelected && isSelected ?
                { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}>{item.name}</Text>}
            </View>
          </TouchableOpacity>
          {
            isOpen ?
              <FlatList
                keyExtractor={this._keyExtractor}
                style={{ flex: 1, paddingLeft: 15 }}
                onEndReachedThreshold={0.01}
                {...this.props}
                data={children as TreeItem[]}
                extraData={this.state}
                renderItem={this._renderRow}
              /> :
              null
          }
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={(e) => this._onPressNode({ e, item })}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isSelected ? selectedBackgroundColor || '#fff' : backgroundColor || '#fff',
          marginBottom: 2,
          height: 24,
          alignItems: 'center'
        }}
        >
          {renderRow ? renderRow(item) : <Text
            style={[styles.textName, isSelected ?
              { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}
          >{item.name}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        {/*{*/}
        {/* {this._renderSearchBar()} */}
        {/*}*/}
        <FlatList
          keyExtractor={this._keyExtractor}
          style={{ flex: 1 }}
          onEndReachedThreshold={0.01}
          {...this.props}
          extraData={this.state}
          renderItem={this._renderRow}
        />
      </View>
    );
  }
}
