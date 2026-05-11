export type Unidade = "m" | "cm" | "mm";

export type SavedScaleRow = {
  id: string;
  nome: string;
  valor_base: number;
  unidade_base: Unidade;
  prop_val: number;
  prop_unit: Unidade;
  created_at?: string;
};

export type Piece = {
  id: number;
  name: string;
  w: number;
  h: number;
  x: number;
  y: number;
  color: string;
};

export type XtoolProjectRow = {
  id: string;
  nome: string;
  ws_w: number;
  ws_h: number;
  pecas: Piece[] | string;
  created_at?: string;
};
