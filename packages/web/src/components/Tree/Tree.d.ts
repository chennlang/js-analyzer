export interface INode {
  label: string;
  path: string;
  value?: string;
  children?: INode[];
}

export interface TNode {
  data: INode;
  isLeaf: boolean;
}