"use strict";

const config = {
    name: "js-schema-validator",
    files: {
        enable: false,
        path: "/var/log/js-schema-validator",
        name: "indb",
        level: "info"
    }
};

const Validator = require("../../src/validator");
const Logger = require("js-logger").init;
const loggers = new Logger(config);
const validator = new Validator(loggers.logger);
const schema = require("../schemas/test");

describe("Core validators", () => {
    describe("Validate integer", () => {
        it("integer", () => {
            expect(validator.isInt(34)).toBe(true);
        });
        it("integer as string", () => {
            expect(validator.isInt("34")).toBe(true);
        });
        it("string of value 1", () => {
            expect(validator.isInt("1")).toBe(true);
        });
        it("string of value 0", () => {
            expect(validator.isInt("0")).toBe(true);
        });
        it("string of value 0x1", () => {
            expect(validator.isInt("0x1")).toBe(true);
        });
    });

    describe("External reference", () => {
        it("external reference", () => {
            expect(validator.isExternalReference("09-35002-201301251900090000-9852")).toBe(true);
        });

        it("invalid external reference", () => {
            expect(validator.isExternalReference("some-stuff")).toBe(false);
        });
    });

    describe("Invalidate integer", () => {
        it("float", () => {
            expect(validator.isInt(34.5)).toBe(false);
        });
        it("float as string", () => {
            expect(validator.isInt("34.5")).toBe(false);
        });
        it("float with comma as string", () => {
            expect(validator.isInt("34,5")).toBe(false);
        });
        it("boolean of value true", () => {
            expect(validator.isInt(true)).toBe(false);
        });
        it("boolean of value false", () => {
            expect(validator.isInt(false)).toBe(false);
        });
        it("real string", () => {
            expect(validator.isInt("not a number")).toBe(false);
        });
    });

    describe("Validate is in list", () => {
        let testlist = ["first", "second", "third-element"];

        it("plain alpha string", () => {
            expect(validator.inList("first", testlist)).toBe(true);
        });
        it("prepended with a dash", () => {
            expect(validator.inList("-second", testlist)).toBe(true);
        });
        it("string containing a dash and prepended with a dash", () => {
            expect(validator.inList("-third-element", testlist)).toBe(true);
        });
    });

    describe("Invalidate is in list", () => {
        let testlist = ["first", "second", "third"];

        it("not in list", () => {
            expect(validator.inList("fourth", testlist)).toBe(false);
        });
        it("in list but appended with a dash", () => {
            expect(validator.inList("first-", testlist)).toBe(false);
        });
        it("in list but prepended with two dash", () => {
            expect(validator.inList("--second", testlist)).toBe(false);
        });
    });

    describe("Validate schema", () => {
        it("minimal JSON", () => {
            let payload = {name: {first: ""}, status: {}, options: {name: {first: "fubar"}}};
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(true);
        });
        it("full JSON", () => {
            let payload = {
                name: {first: "", second: ""},
                description: "",
                nonfloating: 42,
                floating: 42.5,
                status: {},
                options: {
                    name: {first: "fubar", second: "foo"}
                }
            };
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(true);
        });
    });

    describe("Invalidate schema", () => {
        it("empty JSON", () => {
            let payload = {};
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(false);
        });
        it("wrong field", () => {
            let payload = {
                name: {first: ""},
                status: {},
                foo: ""
            };
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(false);
        });
        it("wrong key in object field", () => {
            let payload = {
                name: {first: "", third: ""},
                status: {}
            };
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(false);
        });
        it("wrong type for object field", () => {
            let payload = {
                name: {first: 1},
                status: {}
            };
            expect(validator.isJsonSchemaValid(payload, schema)).toBe(false);
        });
    });

    describe("Check areFieldsValid", () => {
        it("Valid JSON", () => {
            let payload = {
                name: {first: "", second: ""},
                description: "",
                nonfloating: 42,
                floating: 42.5,
                status: {},
                options: {
                    name: {first: "fubar", second: "foo"}
                }
            };
            expect(validator.areFieldsValid(payload, schema)).toBe(true);
        });
        it("Check complex field", () => {
            let payload = {"name[first]": "test"};
            expect(validator.areFieldsValid(payload, schema)).toBe(true);
        });
        it("Check complex field error", () => {
            let payload = {"name[foo]": "test"};
            expect(validator.areFieldsValid(payload, schema)).toBe(false);
        });
        it("wrong field", () => {
            let payload = {
                name: {first: ""},
                status: {},
                foo: ""
            };
            expect(validator.areFieldsValid(payload, schema)).toBe(false);
        });
        it("wrong key in object field", () => {
            let payload = {
                name: {first: "", third: ""},
                status: {}
            };
            expect(validator.areFieldsValid(payload, schema)).toBe(false);
        });
        it("wrong type for object field", () => {
            let payload = {
                name: {first: 1},
                status: {}
            };
            expect(validator.areFieldsValid(payload, schema)).toBe(false);
        });
    });

    describe("Check isPathValid", () => {
        it("Valid path", () => {
            let payload = {
                options: {
                    name: {first: ""}
                }
            };
            expect(validator.isPathValid(payload, schema)).toBe(true);
        });
        it("Valid path regardless of its invalid type", () => {
            let payload = {
                options: {
                    name: {first: 100}
                }
            };
            expect(validator.isPathValid(payload, schema)).toBe(true);
        });
        it("Valid partial path", () => {
            let payload = {
                options: {
                    name: ""
                }
            };
            expect(validator.isPathValid(payload, schema)).toBe(true);
        });
        it("Valid paths", () => {
            let payload = [
                {
                    created: ""
                },
                {
                    name: {first: ""}
                },
                {
                    description: ""
                }
            ];
            expect(validator.arePathsValid(payload, schema)).toBe(true);
        });
        it("Valid paths from string", () => {
            let payload = [
                "name[first]",
                "description"
            ];
            expect(validator.arePathsValid(payload, schema)).toBe(true);
        });
        it("Invalid path", () => {
            let payload = {
                options: {
                    foo: ""
                }
            };
            expect(validator.isPathValid(payload, schema)).toBe(false);
        });
        it("One invalid path", () => {
            let payload = [
                {
                    name: {first: ""}
                },
                {
                    description: ""
                },
                {
                    name: {foo: ""}
                }
            ];
            expect(validator.arePathsValid(payload, schema)).toBe(false);
        });
    });
});
