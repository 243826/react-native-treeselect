import { Component, ReactElement } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface TreeItem {
	id: unknown;
	name: string;
	parent: string;
	children?: TreeItem[];
	type: 'folder' | 'file'
}

export interface LeafClickProps {
	item: TreeItem;
	routes: Omit<TreeItem, 'children'>[];
}

export interface TreeSelectProps {
	data: TreeItem[];
	onClick?: (o : {item : TreeItem, routes : Omit<TreeItem, "children">[], currentNode: string | string[] | null}) => void;
	onClickLeaf?: (p: LeafClickProps) => void;
	isOpen?: boolean;
	openIds?: TreeItem['id'][];
	isShowTreeId?: boolean;
	itemStyle?: StyleProp<TextStyle>;
	selectedItemStyle?: StyleProp<TextStyle>;
	treeNodeStyle?: {
		openIcon?: ReactElement;
		closeIcon?: ReactElement;
	};
	selectType?: 'single' | 'multiple'
	defaultSelectedId?: string[]
	getId: (item : TreeItem) => string 
	getChildren: (item : TreeItem) => TreeItem[]
	leafCanBeSelected?: boolean
	renderRow?: (item : TreeItem) => View
	onlyLeaf?: boolean
}

declare class TreeSelect extends Component<TreeSelectProps, {}> {}

export default TreeSelect;
