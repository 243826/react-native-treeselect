import React, { Component } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity } from 'react-native';
import { CheckBox } from '@react-native-community/checkbox'
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

export default class TreeSelect extends Component {
  constructor(props) {
    super(props);
    this.routes = [];
    this.state = {
      nodesStatus: this._initNodesStatus(),
      currentNode: this._initCurrentNode(),
      searchValue: ''
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

  _find = (data, id) => {
    let { getId, getChildren } = this.props
    const stack = [];
    let going = true;

    const walker = (childrenData, innerId) => {
      if (childrenData === undefined) {
        return
      }

      childrenData.forEach(item => {
        if (!going) return;
        stack.push({
          id: getId(item),
          name: item.name,
          parent: item.parent
        });
        if (getId(item) === innerId) {
          going = false;
        } else {
          if (item.type === 'directory') {
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

  _onPressNode = ({ e, item }) => { // eslint-disable-line
    const { data, selectType, leafCanBeSelected, getId } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      // nodesStatus.set(item && getId(item), !nodesStatus.get(item && getId(item))); // toggle
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(getId(item)) ?
          currentNode.filter(nodeid => nodeid !== getId(item)) : currentNode.concat(getId(item))
        if (leafCanBeSelected) {
          return { nodesStatus };
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
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _onPressCollapse = ({ e, item }) => { // eslint-disable-line
    e.stopPropagation();
    const { data, selectType, leafCanBeSelected, getId } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      nodesStatus.set(item && getId(item), !nodesStatus.get(item && getId(item))); // toggle
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(getId(item)) ?
          currentNode.filter(nodeid => nodeid !== getId(item)) : currentNode.concat(getId(item))
        if (leafCanBeSelected) {
          return { nodesStatus };
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

  _onClickLeaf = ({ e, item }) => { // eslint-disable-line
    const { onClickLeaf, onClick, selectType, leafCanBeSelected, getId, data } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, getId(item));
    this.setState((state) => {
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(getId(item)) ?
          currentNode.filter(nodeid => nodeid !== getId(item)) : currentNode.concat(getId(item))
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
      onClickLeaf && onClickLeaf({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _renderTreeNodeIcon = (isOpen) => {
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

  _keyExtractor = (item, i) => this.props.getId(item);

  _setToggleChekbox = (value) => {};

  _renderRow = ({ item }) => {
    const { currentNode } = this.state;
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle, selectType = 'single', leafCanBeSelected, onlyLeaf, renderRow, getId, getChildren } = this.props;
    const { backgroudColor, fontSize, color } = itemStyle && itemStyle;
    const openIcon = treeNodeStyle && treeNodeStyle.openIcon;
    const closeIcon = treeNodeStyle && treeNodeStyle.closeIcon;

    const selectedBackgroudColor = selectedItemStyle && selectedItemStyle.backgroudColor;
    const selectedFontSize = selectedItemStyle && selectedItemStyle.fontSize;
    const selectedColor = selectedItemStyle && selectedItemStyle.color;
    const isCurrentNode = selectType === 'multiple' ? currentNode.includes(getId(item)) : (currentNode === getId(item));

    if (item.type === 'directory') {
      let children = getChildren(item)
      const isOpen = this.state.nodesStatus && this.state.nodesStatus.get(item && getId(item)) || false;
      return (
        <View>
          <TouchableOpacity onPress={(e) => onlyLeaf ? this._onPressCollapse({ e, item }) : this._onPressNode({ e, item })} >
            <View style={{
              flexDirection: 'row',
              backgroundColor: !leafCanBeSelected && isCurrentNode ? selectedBackgroudColor || '#fff' : backgroudColor || '#fff',
              marginBottom: 2,
              height: 20,
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
          backgroundColor: isCurrentNode ? selectedBackgroudColor || '#fff' : backgroudColor || '#fff',
          marginBottom: 2,
          height: 20,
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

  _onSearch = () => {
    const { searchValue } = this.state;

  };

  _onChangeText = (key, value) => {
    this.setState({
      [key]: value
    });
  };

  // _renderSearchBar = () => {
  //   const { searchValue } = this.state;
  //   return (
  //     <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 5,
  //       borderColor: '#555', marginHorizontal: 10, }}>
  //       <TextInput
  //         style={{ height: 38, paddingHorizontal: 5, flex: 1 }}
  //         value={searchValue}
  //         autoCapitalize="none"
  //         underlineColorAndroid="transparent"
  //         autoCorrect={false}
  //         blurOnSubmit
  //         clearButtonMode="while-editing"
  //         placeholder="搜索节点"
  //         placeholderTextColor="#e9e5e1"
  //         onChangeText={(text) => this._onChangeText('searchValue', text)}
  //       />
  //       <TouchableOpacity onPress={this._onSearch}>
  //         <Ionicons name="ios-search" style={{ fontSize: 25, marginHorizontal: 5 }} />
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

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
