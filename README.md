# schema-validator

Simple compilation of function for validate type, JSON, ...

## Pré-requis
  * NodeJS >4.2.x

## Installation

```bash
npm install
```

## Usage
To initialize an object, you have to pass an instance of [logger](https://github.com/wako057/js-logger) :
```
const Logger = require("js-logger").init;
const loggers = new Logger(config);
const validator = new Validator(loggers.logger);
```

### Tests
```bash
npm run tests -s
```

To get coverage with istanbul, you have to run :
```bash
npm run tests:coverage -s
```
