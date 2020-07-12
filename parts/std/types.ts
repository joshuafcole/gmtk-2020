export type Ref = {
  __state: number;
  __instance: number;
  state_name: string;
  id: number;

  remove(): void;
  draw(): void;
  send(event: string, props?: any): void;
  to_json(): any;
};
export type PluralRef<T> = {
  add(holes: Partial<T>): T;
  each(cb: (instance: T & Ref) => any): void;
  to_json(): any;
};

export type Target = { state: number; instance: number };

export type NestedFnMap = { [name: string]: Function | NestedFnMap };
