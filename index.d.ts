import { Component, ReactElement } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface TreeItem {
	id: string;
	name: string;
	parent: TreeItem;
	children?: TreeItem[]
	type: 'folder' | 'file',
	promise: unknown
}

export interface LeafClickProps {
	item: TreeItem;
	routes: Omit<TreeItem, 'children'>[];
}

export interface TreeSelectProps {
	data: TreeItem[];
	getId: (item : TreeItem) => string 
	getChildren: (item : TreeItem) => TreeItem[] | Promise<TreeItem[]>
	onClickLeaf?: (p: LeafClickProps) => void;
	setIdSelection?: (map : Map<string, boolean>) => void
	getIdSelection?: () => Promise<Map<string, boolean>>
	getOpenIds?: () => Promise<string[]>
	isShowTreeId?: boolean;
	itemStyle?: StyleProp<TextStyle>;
	selectedItemStyle?: StyleProp<TextStyle>;
	treeNodeStyle?: {
		openIcon?: ReactElement;
		closeIcon?: ReactElement;
	};
	selectType?: 'single' | 'multiple'
	leafCanBeSelected?: boolean
	renderRow?: (item : TreeItem) => View
}

declare class TreeSelect extends Component<TreeSelectProps, {}> {}

export default TreeSelect;
