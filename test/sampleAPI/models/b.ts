import Test from './test';

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

export interface BFilter {
  id?: number;
  name?: string;
  levelId?: number;
  tests: number[];
}

export { BInput, BOutput };
