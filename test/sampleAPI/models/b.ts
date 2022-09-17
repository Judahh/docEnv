import Test from './test';
export interface BFilter {
  id?: number;
  name?: string;
  levelId?: number;
  tests: number[];
}

interface BInput {
  name: string;
  /**
   * LevelId of B
   * @example 1
   **/
  levelId: number;
}

type BOutput = {
  /**
   * Id of B
   * @example 1
   * @example 2
   **/
  id: number;
  /**
   * Base Name of B
   **/
  name: string;
  levelId: number;
  test?: Test;
};

export { BInput, BOutput };
