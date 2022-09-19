interface Contact {
  name: string;
  email?: string;
  url?: string;
}

interface License {
  name: string;
  url?: string;
}

interface Info {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
}

interface Server {
  url: string;
  description?: string;
  variables?: {
    [key: string]: {
      default: string;
    };
  };
}

interface Tag {
  name: string;
  description?: string;
}

type Example =
  | unknown
  | {
      value: Example;
      summary: string;
    };

interface BodyContent {
  'application/json': {
    schema: Schema;
    examples: {
      [key: string]: {
        value: Example;
        summary: string;
      };
    };
  };
}

interface Body {
  description?: string;
  content: BodyContent;
}

interface Parameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema?: Schema;
}

interface Method {
  security?: { [key: string]: any };
  tags: string[];
  summary: string;
  operationId: string;
  requestBody: Body;
  responses: { [key: string]: Response };
  parameters: Parameter[];
}

interface Path {
  post?: Method;
  get?: Method;
  put?: Method;
  delete?: Method;
}

interface Schema {
  type?: string;
  description?: string;
  example?: Example;
  format?: string;
  items?: Schema;
  $ref?: string;
  properties?: { [key: string]: Schema };
}

interface SecurityScheme {
  bearerAuth?: {
    type: 'http';
    scheme: 'bearer';
    bearerFormat: 'JWT';
  };
}

interface Swagger {
  openapi: string;
  info?: Info;
  servers?: Server[];
  tags?: Tag[];
  paths: { [key: string]: Path };
  components?: {
    schemas?: { [key: string]: Schema };
    securitySchemes?: { [key: string]: SecurityScheme };
  };
}

export {
  Swagger,
  Contact,
  License,
  Info,
  Server,
  Tag,
  Example,
  BodyContent,
  Body,
  Parameter,
  Method,
  Path,
  Schema,
  SecurityScheme,
};
