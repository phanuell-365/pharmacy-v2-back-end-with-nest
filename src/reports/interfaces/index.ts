interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Header {
  label?: string;
  property?: string;
  width?: number;
  align?: string; //default 'left'
  valign?: string;
  headerColor?: string; //default '#BEBEBE'
  headerOpacity?: number; //default '0.5'
  headerAlign?: string; //default 'left'
  columnColor?: string;
  columnOpacity?: number;
  renderer?: (
    value: any,
    indexColumn?: number,
    indexRow?: number,
    row?: number,
    rectRow?: Rect,
    rectCell?: Rect,
  ) => string;
}

interface DataOptions {
  fontSize: number;
  fontFamily: string;
  separation: boolean;
}

interface Data {
  [key: string]: string | { label: string; options?: DataOptions };
}

export interface Table {
  title?: string;
  subtitle?: string;
  headers?: (string | Header)[];
  datas?: Data[];
  rows?: string[][];
}
