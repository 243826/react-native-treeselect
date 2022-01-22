import React, { Component } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, ListRenderItem, ListRenderItemInfo, GestureResponderEvent } from 'react-native';
import { TreeItem, TreeSelectProps } from '../..';
import { breadthFirstRecursion } from '../utils/menutransform';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  textName: {
    fontSize: 14,
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
  nodesStatus: Map<string, boolean>
  currentNode: string | string[] | null// figure this type out
}
export default class TreeSelect extends Component<TreeSelectProps, StateType> {
  private routes : Omit<TreeItem, "children">[]
  constructor(props : TreeSelectProps) {
    super(props);
    this.routes = [];
    this.state = {
      nodesStatus: this._initNodesStatus(),
      currentNode: this._initCurrentNode()
    };
  }

  _initCurrentNode = () => {
    const { defaultSelectedId, selectType } = this.props;
    if (selectType === 'multiple') {
      return defaultSelectedId || [];
    }
    return defaultSelectedId && defaultSelectedId[0] || null;
  };

  _initNodesStatus = () => {
    const { getId, isOpen = false, data, openIds = [], defaultSelectedId = [] } = this.props;
    const nodesStatus = new Map();
    if (!isOpen) {
      if (openIds && openIds.length) {
        for (let id of openIds) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(getId(parent), true));
        }
      }
      // 设置默认选中时父节点的展开操作
      if (defaultSelectedId && defaultSelectedId.length) {
        for (let id of defaultSelectedId) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(getId(parent), true));
        }
      }
      return nodesStatus;
    }
    breadthFirstRecursion(data).map(item => nodesStatus.set(getId(item), true));
    return nodesStatus;
  };

  _find = (data : TreeItem[], id : unknown) : Omit<TreeItem, "children">[] => {
    let { getId, getChildren } = this.props
    const stack : TreeItem[] = [];
    let going = true;

    const walker = (childrenData : TreeItem[], innerId : unknown) => {
      if (childrenData === undefined) {
        return
      }

      childrenData.forEach(item => {
        if (!going) return;
        stack.push(item);
        if (getId(item) === innerId) {
          going = false;
        } else {
          if (item.type === 'folder') {
            walker(getChildren(item), innerId)            
          } else {
            stack.pop()
          }
        }
      });
      if (going) stack.pop();
    };

    walker(data, id);
    return stack;
  };

  _onPressNode = ({ e, item } : OnEventType ) => { // eslint-disable-line
    const { data, selectType, leafCanBeSelected, getId } = this.props
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      // nodesStatus.set(item && getId(item), !nodesStatus.get(item && getId(item))); // toggle
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const currentNodeArray = currentNode as string[]
        const tempCurrentNode = currentNodeArray.includes(getId(item)) ?
          currentNodeArray.filter(nodeid => nodeid !== getId(item)) : currentNodeArray.concat(getId(item))
        if (leafCanBeSelected) {
          return { nodesStatus } as Pick<StateType, 'nodesStatus'>;
        }
        return { currentNode: tempCurrentNode, nodesStatus };
      } else {
        if (leafCanBeSelected) {
          return { nodesStatus } ;
        }
        return { currentNode: getId(item), nodesStatus } ;
      }
    }, () => {
      const { onClick } = this.props;
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _onPressCollapse = ({ e, item } : OnEventType ) => { // eslint-disable-line
    e.stopPropagation();
    const { data, selectType, leafCanBeSelected, getId } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      nodesStatus.set(item && getId(item), !nodesStatus.get(item && getId(item))); // toggle
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const currentNodeArray = currentNode as string[]
        const tempCurrentNode = currentNodeArray.includes(getId(item)) ?
          currentNodeArray.filter(nodeid => nodeid !== getId(item)) : currentNodeArray.concat(getId(item))
        if (leafCanBeSelected) {
          return { nodesStatus } as Pick<StateType, 'nodesStatus'>;
        }
        return { currentNode: tempCurrentNode, nodesStatus };
      } else {
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: getId(item), nodesStatus };
      }
    }, () => {
      const { onClick } = this.props;
      // onClick && onClick({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _onClickLeaf = ({ item } : OnEventType ) => { // eslint-disable-line
    const { onClickLeaf, onClick, selectType, getId, data } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const currentNodeArray : string[] = currentNode as string[]
        const tempCurrentNode = currentNodeArray.includes(getId(item)) ?
        currentNodeArray.filter(nodeid => nodeid !== getId(item)) : currentNodeArray.concat(getId(item))
        return {
          currentNode: tempCurrentNode,
        };
      } else {
        return {
          currentNode: getId(item)
        };
      }
    }, () => {
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });
      onClickLeaf && onClickLeaf({ item, routes});
    });
  };

  _renderTreeNodeIcon = (isOpen : boolean) => {
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

  _keyExtractor = (item : TreeItem, i : number ) => this.props.getId(item);

  _renderRow = ({ item } : ListRenderItemInfo<TreeItem>) => {
    const { currentNode } = this.state;
    const { isShowTreeId = false, selectedItemStyle, itemStyle, selectType = 'single', leafCanBeSelected, onlyLeaf, renderRow, getId, getChildren } = this.props;
    const { backgroundColor, fontSize, color } = itemStyle && itemStyle;

    const selectedBackgroundColor = selectedItemStyle?.backgroundColor;
    const selectedFontSize = selectedItemStyle?.fontSize;
    const selectedColor = selectedItemStyle?.color;
    const isCurrentNode = selectType === 'multiple' ? (currentNode as string[]).includes(getId(item)) : (currentNode === getId(item));

    if (item.type === 'folder') {
      let children = getChildren(item)
      const isOpen = this.state.nodesStatus && this.state.nodesStatus.get(item && getId(item)) || false;
      return (
        <View>
          <TouchableOpacity onPress={(e) => onlyLeaf ? this._onPressCollapse({ e, item }) : this._onPressNode({ e, item })} >
            <View style={{
              flexDirection: 'row',
              backgroundColor: !leafCanBeSelected && isCurrentNode ? selectedBackgroundColor || '#fff' : backgroundColor || '#fff',
              marginBottom: 2,
              height: 24,
              alignItems: 'center'
            }}
            >
              <TouchableOpacity onPress={(e) => this._onPressCollapse({ e, item })}>{this._renderTreeNodeIcon(isOpen)}</TouchableOpacity>
              {
                isShowTreeId && <Text style={{ fontSize: 14, marginLeft: 4 }}>{getId(item)}</Text>
              }
              
              {renderRow ? renderRow(item) : <Text style={[styles.textName, !leafCanBeSelected && isCurrentNode ?
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
                data={children}
                extraData={this.state}
                renderItem={this._renderRow}
              /> :
              null
          }
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={(e) => this._onClickLeaf({ e, item })}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isCurrentNode ? selectedBackgroundColor || '#fff' : backgroundColor || '#fff',
          marginBottom: 2,
          height: 24,
          alignItems: 'center'
        }}
        >
          {renderRow ? renderRow(item) : <Text
            style={[styles.textName, isCurrentNode ?
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
