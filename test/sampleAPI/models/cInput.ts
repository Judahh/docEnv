export default interface CInput {
  name: string;
  levelId: number;
  el: { a: number } & { b: number };
  el2: { a: number } | { b: number };
}
