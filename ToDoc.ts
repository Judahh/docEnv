// const core = require('@actions/core');
// const AWS_KEY_ID = core.getInput('aws_key_id', {
//     required: true
//   });
//   const SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
//     required: true
//   });
//   const BUCKET = core.getInput('aws_bucket', {
//     required: true
//   });
//   const SOURCE_DIR = core.getInput('source_dir', {
//     required: true
//   });
//   const DESTINATION_DIR = core.getInput('destination_dir', {
//     required: false
//   });
const file = `
import { PersistenceInfo } from 'flexiblepersistence';
import { ConnectionOptions } from 'tls';
const writeDatabaseOptions =
  process.env.DATABASE_OPTIONS || process.env.DATABASE_WRITE_OPTIONS;
const writeDatabaseSSLEnv =
  process.env.DATABASE_SSL || process.env.DATABASE_WRITE_SSL || 'false';
const writeDatabaseSSL:
  | boolean
  | ConnectionOptions
  | ConnectionOptions
  | undefined = writeDatabaseSSLEnv
  ? JSON.parse(writeDatabaseSSLEnv)
  : undefined;
const writeDatabaseConnectionTimeout =
  process.env.DATABASE_CONNECTION_TIMEOUT ||
  process.env.DATABASE_WRITE_CONNECTION_TIMEOUT;
const writeDatabaseConnectionTimeoutNumber = writeDatabaseConnectionTimeout
  ? +writeDatabaseConnectionTimeout
  : 60000;
const writeDatabaseRequestTimeout =
  process.env.DATABASE_REQUEST_TIMEOUT ||
  process.env.DATABASE_WRITE_REQUEST_TIMEOUT;
const writeDatabaseRequestTimeoutNumber = writeDatabaseRequestTimeout
  ? +writeDatabaseRequestTimeout
  : 60000;

const writeDatabaseEncryptionDisabledEnv =
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === '1';

const writeDatabaseEncryptionDisabled = writeDatabaseEncryptionDisabledEnv
  ? {
      encrypt: false,
      trustServerCertificate: false,
    }
  : undefined;

const eventInfo =
  process.env.DATABASE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_WRITE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_WRITE_DISABLED?.toLowerCase() === '1'
    ? undefined
    : {
        uri: process.env.DATABASE_URI || process.env.DATABASE_WRITE_URI,
        connectionType:
          process.env.DATABASE_CONNECTION_TYPE ||
          process.env.DATABASE_WRITE_CONNECTION_TYPE,
        options: writeDatabaseOptions
          ? JSON.parse(writeDatabaseOptions)
          : writeDatabaseEncryptionDisabled,
        database:
          process.env.DATABASE_NAME ||
          process.env.DATABASE_WRITE_NAME ||
          'write',
        host: process.env.DATABASE_HOST || process.env.DATABASE_WRITE_HOST,
        port: process.env.DATABASE_PORT || process.env.DATABASE_WRITE_PORT,
        username: process.env.DATABASE_USER || process.env.DATABASE_WRITE_USER,
        password:
          process.env.DATABASE_PASSWORD || process.env.DATABASE_WRITE_PASSWORD,
        ssl: writeDatabaseSSL,
        connectionTimeout: writeDatabaseConnectionTimeoutNumber,
        requestTimeout: writeDatabaseRequestTimeoutNumber,
      };

const readDatabaseOptions =
  process.env.DATABASE_OPTIONS || process.env.DATABASE_READ_OPTIONS;
const readDatabaseSSLEnv =
  process.env.DATABASE_SSL || process.env.DATABASE_READ_SSL || 'false';
const readDatabaseSSL:
  | boolean
  | ConnectionOptions
  | ConnectionOptions
  | undefined = readDatabaseSSLEnv ? JSON.parse(readDatabaseSSLEnv) : undefined;
const readDatabaseConnectionTimeout =
  process.env.DATABASE_CONNECTION_TIMEOUT ||
  process.env.DATABASE_READ_CONNECTION_TIMEOUT;
const readDatabaseConnectionTimeoutNumber = readDatabaseConnectionTimeout
  ? +readDatabaseConnectionTimeout
  : 60000;
const readDatabaseRequestTimeout =
  process.env.DATABASE_REQUEST_TIMEOUT ||
  process.env.DATABASE_READ_REQUEST_TIMEOUT;
const readDatabaseRequestTimeoutNumber = readDatabaseRequestTimeout
  ? +readDatabaseRequestTimeout
  : 60000;

const readDatabaseEncryptionDisabledEnv =
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_READ_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_READ_ENCRYPTION_DISABLED?.toLowerCase() === '1';

const readDatabaseEncryptionDisabled = readDatabaseEncryptionDisabledEnv
  ? {
      encrypt: false,
      trustServerCertificate: false,
    }
  : undefined;

const readInfo =
  process.env.DATABASE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_READ_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_READ_DISABLED?.toLowerCase() === '1'
    ? undefined
    : {
        uri: process.env.DATABASE_URI || process.env.DATABASE_READ_URI,
        connectionType:
          process.env.DATABASE_CONNECTION_TYPE ||
          process.env.DATABASE_READ_CONNECTION_TYPE,
        options: readDatabaseOptions
          ? JSON.parse(readDatabaseOptions)
          : readDatabaseEncryptionDisabled,
        database:
          process.env.DATABASE_NAME || process.env.DATABASE_READ_NAME || 'read',
        host: process.env.DATABASE_HOST || process.env.DATABASE_READ_HOST,
        port: process.env.DATABASE_PORT || process.env.DATABASE_READ_PORT,
        username: process.env.DATABASE_USER || process.env.DATABASE_READ_USER,
        password:
          process.env.DATABASE_PASSWORD || process.env.DATABASE_READ_PASSWORD,
        ssl: readDatabaseSSL,
        connectionTimeout: readDatabaseConnectionTimeoutNumber,
        requestTimeout: readDatabaseRequestTimeoutNumber,
      };

let readDatabase;
let eventDatabase;

const setEventDatabase = (journaly) => {
  if (eventInfo === undefined) return undefined;
  else eventDatabase = new PersistenceInfo(eventInfo, journaly);
  if (
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === 'true' ||
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === '1' ||
    eventDatabase !== undefined
  ) {
    console.log(
      'eventInfo:',
      eventDatabase?.host,
      eventDatabase?.port,
      eventDatabase?.database
    );
  }
};

const setReadDatabase = (journaly) => {
  if (readInfo === undefined) return undefined;
  else readDatabase = new PersistenceInfo(readInfo, journaly);
  if (
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === 'true' ||
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === '1' ||
    readDatabase !== undefined
  ) {
    console.log(
      'readInfo:',
      readDatabase?.host,
      readDatabase?.port,
      readDatabase?.database
    );
  }
};

const getEventDatabase = (journaly?) => {
  if (eventInfo === undefined) return undefined;
  if (eventDatabase !== undefined) {
    return eventDatabase;
  } else if (journaly) {
    setEventDatabase(journaly);
    return eventDatabase;
  }
  return undefined;
};

const getReadDatabase = (journaly?) => {
  if (readInfo === undefined) return undefined;
  if (readDatabase !== undefined) {
    return readDatabase;
  } else if (journaly) {
    setReadDatabase(journaly);
    return readDatabase;
  }
  return undefined;
};

export {
  eventInfo,
  readInfo,
  setEventDatabase,
  setReadDatabase,
  getEventDatabase,
  getReadDatabase,
};
`;

class Checker {
  public static group(string: string) {
    let brackets = "[]{}()<>";
    let stack: Array<number> = [];

    for (let index = 0; index < string.length; index++) {
      const bracket = string[index];
      let bracketsIndex = brackets.indexOf(bracket);

      if (bracketsIndex === -1) {
        continue;
      }

      if (bracketsIndex % 2 === 0) {
        stack.push(bracketsIndex + 1);
      } else if (stack.pop() !== bracketsIndex) {
        return undefined;
      }
      if (stack.length === 0) {
        const newString = string.slice(0, index + 1);
        // console.log(newString);
        return newString;
      }
    }
    if (stack.length === 0) {
      // console.log(string);
      return string;
    }
    return undefined;
  }

  public static checkOptions(string: string) {
    let elements = "&|?:,;";
    let min = Infinity;
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      if (string.indexOf(element) !== -1) {
        if (min > index || min == Infinity) min = index;
      }
    }
    if (min == Infinity) return string;
    if (min < 2) return Checker.checkOption(string);
    return Checker.checkTernary(string);
  }

  public static checkOption(string: string, and?: boolean) {
    let brackets = "[]{}()<>";
    let option = and ? "&" : "|";
    let options: Array<string> = [];
    let begin = 0;
    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      let optionIndex = option === element ? index : -1;
      let bracketsIndex = brackets.indexOf(element);

      if (bracketsIndex > -1) {
        // group and ignore
        const g = Checker.group(string.substring(index));
        // console.log('group:', g);
        index += (g?.length || 1) - 1;
        continue;
      }

      if (optionIndex === -1) {
        continue;
      } else {
        options.push(string.substring(begin, index));
        begin = index;
      }
    }
    options.push(string.substring(begin, string.length));
    options = options
      .map((o) => o.replace(option, "").trim())
      .filter((o) => o.length > 0);
    let formattedOptions: any = options;
    if (!and && string.includes("&"))
      formattedOptions = options.map((o) => Checker.checkOption(o, true));
    formattedOptions = formattedOptions.map((o:any) =>
      typeof o === "string" ? Checker.checkOptions(o) : o
    );
    return and ? { and: formattedOptions } : { or: formattedOptions };
  }

  public static checkTernary(string: string): any {
    let elements = "?:,;";
    let brackets = "[]{}()<>";
    let lastIndex = -1;
    let endIf = -1;
    let endThen = -1;

    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      let elementsIndex = elements.indexOf(element);
      let bracketsIndex = brackets.indexOf(element);

      if (bracketsIndex > -1) {
        // group and ignore
        const g = Checker.group(string.substring(index));
        // console.log('group:', g);
        index += (g?.length || 1) - 1;
        continue;
      }

      if (elementsIndex === -1) {
        continue;
      }

      if (elementsIndex > 1) {
        const ifEl = string.substring(0, endIf).trim();
        const thenEl = string.substring(endIf + 1, endThen).trim();
        const elseEl = string
          .substring(endThen + 1)
          .trim()
          .replace(/[,;]/, "");
        console.log("ifEl:", ifEl, typeof ifEl);
        console.log("thenEl:", thenEl, typeof thenEl);
        console.log("elseEl:", elseEl, typeof elseEl);

        return {
          if: typeof ifEl === "string" ? Checker.checkOptions(ifEl) : ifEl,
          then: typeof thenEl === "string" ? Checker.checkOptions(thenEl) : thenEl,
          else: typeof elseEl === "string" ? Checker.checkOptions(elseEl) : elseEl,
        };
      } else if (elementsIndex > lastIndex) {
        if (lastIndex === -1) {
          endIf = index;
        }
        if (lastIndex === 0) {
          endThen = index;
        }
        lastIndex = elementsIndex;
      }
    }
    if (endThen > -1 && endIf > -1) {
      const ifEl = string.substring(0, endIf).trim();
      const thenEl = string.substring(endIf + 1, endThen).trim();
      const elseEl = string
        .substring(endThen + 1)
        .trim()
        .replace(/[,;]/, "");
      console.log("ifEl:", ifEl, typeof ifEl);
      console.log("thenEl:", thenEl, typeof thenEl);
      console.log("elseEl:", elseEl, typeof elseEl);
      return {
        if: typeof ifEl === "string" ? Checker.checkOptions(ifEl) : ifEl,
        then: typeof thenEl === "string" ? Checker.checkOptions(thenEl) : thenEl,
        else: typeof elseEl === "string" ? Checker.checkOptions(elseEl) : elseEl,
      };
    } else return undefined;
  }
}


const splittedLines = file
  .replace(/(?:\r\n|\r|\n)/g, " ")
  .replace("\\n", " ")
  .replace("\n", " ")
  .replace("\r\n", " ")
  .replace(/[ \n]+/g, " ")
  .split(/;+/)
  .filter((str) => str.includes("process.env") || str.includes("@env_var"))
  .filter((str) => {
    const strSplit = str.split("{")[0].replace(" ", "");
    // console.log("strSplit:", strSplit);
    return strSplit.match(/^([\n ]*(var)|(let)|(const)[\n ]+)/gm);
  });

// console.log("splittedFile", splittedLines);

let envVars = [...file.matchAll(/process\.env\.([\w]+)/gm)]
  .map((match) => (match + "").replace("process.env.", "").split(","))
  .flat();
envVars = [...new Set(envVars)];
console.log("all envVars", envVars);

let all = {};

for (const line of splittedLines) {
  let variables = line
    .split(/[=]+/)[0]
    .split(/[:;,.\?\|\& ]+/)
    .filter((str) => str.trim() !== "");

  const variable =
    variables.length === 1
      ? variables[0]
      : variables.length >= 2
      ? variables[1]
      : variables[0];

  // console.log("variable", variable);

  let envVars = [...line.matchAll(/process\.env\.([\w]+)/gm)]
    .map((match) => (match + "").replace("process.env.", "").split(","))
    .flat();
  envVars = [...new Set(envVars)];

  console.log("line", line);
  let defaultValuesStrArr = line.split("=");

  defaultValuesStrArr.splice(0, 1);
  let defaultValuesStr = defaultValuesStrArr.join("=");
  console.log("defaultValuesStr", defaultValuesStr);

  // let defaultValuesStr = defaultValuesStrArr.join("=").replace(/process\.env\.([\w]+)\?*\.*[\w]+\(*\)* *[<>=]=* *'*"*`*[\w]+`*"*'*/gm, (a,e1)=>e1);
  // const format = defaultValuesStr
  //   .replace(
  //     /\.([^ \n\|\&=<>]+) *([<>=]=+) *([^ \n\|\&=<>]+)/g,
  //     (_a, e1) => `.${e1} `
  //   )
  //   .replace(/[ \n]+/g, " ");
  // const uniq = format.replace(
  //   / +([^ \n\|\&=<>]+) +\|+ +([^ \n\|\&=<>]+) +/g,
  //   (a, e1, e2) => {
  //     //   console.log("A: ", a);
  //     //   console.log("E1: ", e1);
  //     //   console.log("E2: ", e2);
  //     return e1 === e2 ? ` ${e1} ` : ` ${e1} || ${e2} `;
  //   }
  // );
  // const defaultValues = uniq
  //   .split(/[:;,.\?\|\& ]+/)
  //   .filter((defaults) => defaults !== "" && defaults !== "env");
  // const required = defaultValues.length === 0;

  const splitted = {
    variable,
    envVars,
    line,
    // required,
    // defaultValues,
    defaultValuesStr,
  };
  all[variable] = splitted;
}

console.log(all);
