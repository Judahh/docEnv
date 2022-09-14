import Test from './test';
export interface BFilter {
  id?: number;
  name?: string;
  levelId?: number;
  tests: number[];
}

interface BInput {
  name: string;
  levelId: number;
}

type BOutput = {
  id: number;
  name: string;
  levelId: number;
  test?: Test;
};

export { BInput, BOutput };
