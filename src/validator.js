"use strict";

const jsonValidator = require("is-my-json-valid");
const _ = require("lodash");
const qs = require("qs");

class Validator {
    constructor (logger) {
        this.logger = logger;
    }

    /**
     * @param {String} value
     * @returns {Boolean}
     */
    isExternalReference (value) {
        return /[0-9]{2}-[0-9]{5}-[0-9]{18}-[0-9]{4}/.test(value);
    }

    /**
     * @param {String} value
     * @returns {Boolean}
     */
    isInt (value) {
        let numValue = Number(value);
        let isBoolean = (typeof value === "boolean");
        let isInteger = (numValue % 1 === 0);

        return !isBoolean && isInteger;
    }

    /**
     * @param {String} value
     * @param {Array} list
     * @returns {Boolean}
     */
    inList (value, list) {
        let values = value.split(",");

        for (value of values) {
            if (list.indexOf(value.replace(/^-/, "")) === -1) {
                this.logger.error(`${value.replace(/^-/, "")} not found in list`);
                return false;
            }
        }

        return true;
    }

    /**
     * @param {Object} json
     * @param {Object} schema
     * @returns {Boolean}
     */
    isJsonSchemaValid (json, schema) {
        let validate = jsonValidator(schema, { verbose: true, greedy: true });

        if (validate(json)) {
            return true;
        } else {
            this.logger.error(validate.errors);
            return false;
        }
    }

    /**
     * @param {Object} parameters
     * @param {Object} schema
     * @returns {Boolean}
     */
    areFieldsValid (parameters, schema) {
        let errors = [];
        parameters = _.omit(parameters, ["sort", "id", "-id", "created", "-created"]);

        for (let parameter of _.keys(parameters)) {
            this.logger.trace(parameter);
            let field = parameter.replace(/^-/, "");

            // Only get part before bracket, if any
            if (!this.inList(field.split("[")[0], _.keys(schema.properties))) {
                this.logger.trace("Checking root parameters");
                errors.push(`field ${field.split("[")[0]} not valid`);
            } else if (field.includes("[")) {
                this.logger.trace("Checking object as string");
                // translate string to JSON
                errors = this.checkPartialJson(qs.parse(field), schema, errors);
            } else if (schema.properties[field].type === "object") {
                this.logger.trace("Checking object");
                // re-build a full JSON from its key and value
                let parameterObj = {};
                parameterObj[field] = parameters[field];
                errors = this.checkPartialJson(parameterObj, schema, errors);
            }
        }

        if (errors.length > 0) {
            this.logger.error(errors);
            return false;
        }

        return true;
    }

    /**
     * Check all the paths exist in the schema
     *
     * @param {Array} paths
     * @param {Object} schema
     * @returns {Boolean}
     */
    arePathsValid (paths, schema) {
        let valid = true;

        for (let path of paths) {
            let pathToCheck = path;
            if (typeof path !== "object") {
                this.logger.trace("converting to object");
                pathToCheck = qs.parse(path);
            }

            if (!this.isPathValid(pathToCheck, schema)) {
                valid = false;
            }
        }

        return valid;
    }

    /**
     * Check the path exists in the schema
     *
     * @param {Object} path
     * @param {Object} schema
     * @returns {Boolean}
     */
    isPathValid (path, schema) {
        let base = {};
        Object.assign(base, schema.properties);

        for (let key of this.getKeys(path)) {
            key = key.replace(/^-/, "");
            if (["sort", "id", "created"].indexOf(key) !== -1) {
                continue;
            }

            this.logger.trace(`Checking ${key} is in schema`);
            if (_.has(base, key)) {
                base = base[key].properties;
            } else {
                this.logger.error(`Key ${key} not found in schema`);
                return false;
            }
        }

        return true;
    }

    /**
     * Recursive method to get a list of elements composing a path
     *
     * @param {Object} path
     * @param {Array} keys
     * @returns {Array}
     */
    getKeys (path, keys) {
        if (!keys) {
            keys = [];
        }

        for (let key in path) {
            if (path.hasOwnProperty(key)) {
                keys.push(key);
                // jshint -W073
                if (typeof(path[key]) === "object") {
                    this.getKeys(path[key], keys);
                }
                // jshint +W073
            }
        }

        return keys;
    }

    /**
     * JSON schema validator for fields, handle '-'
     * append to errors, should probably return a boolean and log them
     *
     * @param {Object} parameter
     * @param {Object} schema
     * @param {Array} errors
     * @returns {Array}
     */
    checkPartialJson (parameter, schema, errors) {
        let field = _.keys(parameter)[0];
        let value = _.values(parameter)[0];

        if (!this.isJsonSchemaValid(value, schema.properties[field])) {
            errors.push(`field ${JSON.stringify(parameter)} not valid`);
        }

        return errors;
    }
}

module.exports = Validator;
