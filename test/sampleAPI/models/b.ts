import Test from './test';

interface BInput {
  name: string;
  levelId: number;
}

interface BOutput {
  id: number;
  name: string;
  levelId: number;
  test?: Test;
}

export interface BFilter {
  id?: number;
  name?: string;
  levelId?: number;
}

export { BInput, BOutput };
