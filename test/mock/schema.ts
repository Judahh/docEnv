/* eslint-disable @typescript-eslint/no-empty-interface */
const BaseSchemaDefault = class {};
interface SchemaDefinition {}
const Schema = class {
  public static Types = {
    String: class {},
    Number: class {},
    Boolean: class {},
    Date: class {},
    ObjectId: class {},
    Mixed: class {},
    Array: class {},
    Decimal128: class {},
  };
};
export { BaseSchemaDefault, SchemaDefinition, Schema };
