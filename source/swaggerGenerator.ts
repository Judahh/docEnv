/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Parsed, Route } from './models/parsed';
import { Parameter, Schema, Swagger } from './models/swagger';

class SwaggerGenerator {
  static generateHeaderParameters(receivedSwagger: Swagger): {
    parameters: Array<Parameter>;
    swagger: Swagger;
  } {
    const swagger = receivedSwagger;
    if (!swagger.components) swagger.components = {};
    if (!swagger.components.schemas) swagger.components.schemas = {};
    if (!swagger.components.schemas.page) {
      swagger.components.schemas.page = {
        type: 'integer',
        format: 'int32',
      };
    }
    if (!swagger.components.schemas.pageSize) {
      swagger.components.schemas.pageSize = {
        type: 'integer',
        format: 'int32',
      };
    }
    if (!swagger.components.schemas.pages) {
      swagger.components.schemas.pages = {
        type: 'integer',
        format: 'int32',
      };
    }
    return {
      parameters: [
        {
          name: 'page',
          in: 'header',
          schema: {
            $ref: `#/components/schemas/page`,
          },
        },
        {
          name: 'pageSize',
          in: 'header',
          schema: {
            $ref: `#/components/schemas/pageSize`,
          },
        },
        {
          name: 'pages',
          in: 'header',
          schema: {
            $ref: `#/components/schemas/pages`,
          },
        },
      ],
      swagger,
    };
  }

  static generateParameters(
    route: Route,
    name: string,
    crud: string,
    receivedSwagger: Swagger
  ) {
    const method = route.methods[crud];
    const input = method.input;
    const headerParameters = this.generateHeaderParameters(receivedSwagger);
    const parameters: Array<Parameter> = headerParameters.parameters;
    const swagger = headerParameters.swagger;
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        const element = input[key];
        const schema = this.generateSchema(element, swagger, key);
        if (key === 'id') {
          parameters.push({
            name: key,
            in: 'path',
            required: true,
            schema: {
              $ref: schema.$ref,
            },
          });
        }
        parameters.push({
          name: key,
          in: 'path',
          schema: {
            $ref: schema.$ref,
          },
        });
      }
    }
    if (!swagger?.paths?.[route.path]?.[name])
      swagger.paths[route.path][name] = {};
    swagger.paths[route.path][name].parameters = parameters;
    return swagger;
  }

  static generateSchema(
    receivedElement: any,
    receivedSwagger: Swagger,
    name?: string
  ): { swagger: Swagger; $ref: string; name?: string } {
    let swagger = receivedSwagger;
    const element = receivedElement;
    // console.log('generateSchema', element, name);
    let schema: Schema;
    if (name === 'or') {
      schema = {
        type: 'array',
        items: {
          oneOf: element.map((e) => ({ type: typeof e })),
        },
      };
    } else if (name === 'and') {
      schema = {
        type: 'array',
        items: {
          allOf: element.map((e) => ({ type: typeof e })),
        },
      };
    } else {
      schema = {
        type: typeof element,
      };
    }
    if (typeof element === 'object' && schema?.type !== 'array') {
      // console.log('object', element);
      schema.properties = {};
      for (const key in element) {
        if (Object.prototype.hasOwnProperty.call(element, key)) {
          const element2 = element[key];
          const nS = this.generateSchema(element2, swagger, key);
          swagger = nS.swagger;
          if (!schema?.properties?.[key]) schema.properties[key] = {};
          schema.properties[key].$ref = nS.$ref;
        }
      }
    } else if (
      // @ts-ignore
      schema?.items?.oneOf ||
      // @ts-ignore
      schema?.items?.anyOf ||
      // @ts-ignore
      schema?.items?.allOf
    ) {
      // console.log('else', element);
      const items = // @ts-ignore
        schema?.items?.oneOf ||
        // @ts-ignore
        schema?.items?.anyOf ||
        // @ts-ignore
        schema?.items?.allOf;
      for (const item of items) {
        const nS = this.generateSchema(item, swagger);
        swagger = nS.swagger;
        if (nS.$ref) {
          item.$ref = nS.$ref;
        }
      }
    }
    if (!swagger.components) swagger.components = {};
    if (!swagger.components.schemas) swagger.components.schemas = {};

    const found = this.findSchema(swagger?.components?.schemas, element, name);
    const $ref = found
      ? found.$ref
        ? found.$ref
        : found.index
        ? `#/components/schemas/${name}-${found.index}`
        : `#/components/schemas/${name}`
      : `#/components/schemas/${name}`;

    if (!found) swagger.components.schemas[`${name}`] = schema;
    return {
      swagger,
      $ref,
      name,
    };
  }

  static checkSchema(
    schema?: Schema,
    name?: string,
    newSchema?: any,
    newName?: string,
    receivedIndex?: number
  ): { index?: number; $ref?: string } | undefined {
    let index: number | undefined = receivedIndex || 0;
    if (name && name.split('-')[0] === newName) {
      const currentIndex = parseInt(name.split('-')[1] || '0');
      if (currentIndex >= index) index = currentIndex || 0 + 1;
    }
    if (
      schema?.type === newSchema?.type &&
      schema?.format === newSchema?.format
    ) {
      for (const key in schema?.properties) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          const property = schema?.[key];
          const found = this.checkSchema(
            property,
            key,
            newSchema.properties[key],
            key
          );
          if (found?.$ref) continue;
          else {
            if (index === 0) return undefined;
            else return { index };
          }
        }
      }
      if (newSchema?.items) {
        const items = // @ts-ignore
          schema?.items?.oneOf ||
          // @ts-ignore
          schema?.items?.anyOf ||
          // @ts-ignore
          schema?.items?.allOf ||
          schema?.items;
        const newItems = // @ts-ignore
          newSchema?.items?.oneOf ||
          // @ts-ignore
          newSchema?.items?.anyOf ||
          // @ts-ignore
          newSchema?.items?.allOf ||
          newSchema?.items;
        const found = this.findSchema(items, newItems);
        if (found?.$ref) return { $ref: schema?.$ref };
      } else {
        if (!schema?.items && !newSchema.items) {
          return { $ref: schema?.$ref };
        }
      }
    }
    if (index === 0) index = undefined;
    return index ? { index } : undefined;
  }

  static findSchema(
    schemas?: { [key: string]: Schema },
    newSchema?: any,
    name?: string
  ): { index?: number; $ref?: string } | undefined {
    if (schemas == undefined) return undefined;
    else {
      const index = 0;
      for (const key in schemas) {
        if (Object.prototype.hasOwnProperty.call(schemas, key)) {
          const schema = schemas[key];
          const found = this.checkSchema(schema, key, newSchema, name, index);
          if (found) return found;
        }
      }
    }
  }

  static generateMethod(
    route: Route,
    name: string,
    crud: string,
    receivedSwagger: Swagger
  ): Swagger {
    let swagger = this.generateParameters(route, name, crud, receivedSwagger);
    swagger = this.generateSchema(route.methods[crud].output, swagger)?.swagger;
    swagger = this.generateSchema(route.methods[crud].input, swagger)?.swagger;
    return swagger;
  }

  static generateFromMethodName(
    route: Route,
    crud: string,
    receivedSwagger: Swagger
  ): Swagger {
    let swagger = receivedSwagger;
    const method = route.methods[crud];
    if (method)
      for (const key in method.http) {
        if (Object.prototype.hasOwnProperty.call(method.http, key)) {
          const name = method.http[key];
          swagger = this.generateMethod(route, name, crud, swagger);
        }
      }

    return swagger;
  }

  static generateFromKey(
    parsed: Parsed,
    key: string,
    receivedSwagger: Swagger
  ): Swagger {
    let swagger = receivedSwagger;
    const element = parsed[key];
    swagger.paths[element.path] = {};
    for (const key2 in element.methods) {
      if (Object.prototype.hasOwnProperty.call(element.methods, key2)) {
        swagger = this.generateFromMethodName(element, key2, swagger);
      }
    }
    return swagger;
  }

  static generate(parsed: string | Parsed): Swagger {
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed) as Parsed;
    }
    let swagger: Swagger = {
      openapi: '3.0.0',
      paths: {},
    };
    for (const key in parsed) {
      if (Object.prototype.hasOwnProperty.call(parsed, key)) {
        swagger = this.generateFromKey(parsed, key, swagger);
      }
    }
    return swagger;
  }
}

export { SwaggerGenerator };
