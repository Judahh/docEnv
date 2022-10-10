import { BFilter } from './b';

interface CFilter {
  /**
   * Id of C
   */
  id?: number;
  /**
   * Name of C
   */
  name?: string;
  /**
   * LevelId of C
   */
  levelId?: number;
  /**
   * SAMPLE of  A & B
   */
  mix?: CFilter & BFilter;
  /**
   * SAMPLE of  A | B
   */
   Z?: CFilter | BFilter;
}

export default CFilter;
