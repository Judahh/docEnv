interface Method {
  filter?: unknown;
  input?: unknown;
  output?: unknown;
  http: string[];
}

interface Create extends Method {
  http: ['post'];
}

interface Read extends Method {
  http: ['get'];
}

interface Update extends Method {
  http: ['put', 'patch'];
}
interface Delete extends Method {
  http: ['delete'];
}

interface Route {
  path: string;
  name: string;
  controller: string;
  controllerPath: string;
  service: string;
  methods: {
    create?: Create;
    read?: Read;
    update?: Update;
    delete?: Delete;
  };
}

interface Parsed {
  [key: string]: Route;
}

export { Parsed, Route, Method, Create, Read, Update, Delete };
