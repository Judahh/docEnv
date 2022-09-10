import { BaseSchemaDefault, Schema, SchemaDefinition } from '../../mock/schema';

export default class ConfigSchema extends BaseSchemaDefault {
  protected attributes: SchemaDefinition = {
    id: {
      type: Schema.Types.ObjectId,
      unique: true,
      index: true,
      required: true,
    },
    store: {
      type: Schema.Types.Number,
      required: false,
    },
    minimumQuantity: {
      type: Schema.Types.Number,
      required: false,
    },
    disableSellerStoreId: {
      type: Schema.Types.Boolean,
      required: false,
    },
    priceTable: {
      type: Schema.Types.Number,
      required: false,
    },
    phone: {
      type: Schema.Types.String,
      required: false,
    },
    whatsApp: {
      type: Schema.Types.String,
      required: false,
    },
    instagram: {
      type: Schema.Types.String,
      required: false,
    },
    email: {
      type: Schema.Types.String,
      required: false,
    },
    name: {
      type: Schema.Types.String,
      required: false,
    },
    city: {
      type: Schema.Types.String,
      required: false,
    },
    state: {
      type: Schema.Types.String,
      required: false,
    },
    address: {
      type: Schema.Types.String,
      required: false,
    },
    neighborhood: {
      type: Schema.Types.String,
      required: false,
    },
    postalCode: {
      type: Schema.Types.String,
      required: false,
    },
    location: {
      type: Schema.Types.String,
      required: false,
    },
  };
}
