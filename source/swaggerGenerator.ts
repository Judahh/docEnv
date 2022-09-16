import { Parsed, Route } from './models/parsed';
import { Swagger } from './models/swagger';

class SwaggerGenerator {
  static generateFromMethodName(
    route: Route,
    key: string,
    receivedSwagger: Swagger
  ): Swagger {
    const swagger = receivedSwagger;
    const method = route.methods[key];
    if (method)
      for (const key2 in method.http) {
        if (Object.prototype.hasOwnProperty.call(method.http, key2)) {
          const element3 = method.http[key2];
          swagger.paths[method.path][element3] = {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${method.name}-${key}`,
                  },
                },
              },
            },
          };
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
