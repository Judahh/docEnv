const anError3 = new Error();

const a = true;
/**
 * SAMPLE B
 *
 * {@label STRING_INDEXER}
 * @of anError2
 * @alpha
 */
const b = false;
/**
 * SAMPLE C
 *
 * {@label STRING_INDEXER}
 * @of anError2
 * @of anError3
 * @alpha
 */
const c = a && b;

/**
 * Create A
 * aSDasdAS
 * ASDFASDFASDJFHK HSDF AKSDH FKAJSHDF KJASLD KFA
 *
 * FERQWERQEWRQWER
 *
 * @param input - Input for creating A
 * @param input.name - Name of A
 */
const d = (input) => {
  return input;
};

export { a, b, c, d, anError3 };
