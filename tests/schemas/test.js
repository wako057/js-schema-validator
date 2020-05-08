"use strict";

module.exports = {
    required: true,
    type: "object",
    additionalProperties: false,
    properties: {
        name: {
            required: true,
            type: "object",
            additionalProperties: false,
            anyOf: [
                { required: ["first"] },
                { required: ["second"] }
            ],
            properties: {
                first: {
                    required: false,
                    type: "string"
                },
                second: {
                    required: false,
                    type: "string"
                }
            }
        },
        nonfloating: {
            required: false,
            type: "integer"
        },
        floating: {
            required: false,
            type: "number"
        },
        description: {
            required: false,
            type: "string"
        },
        status: {
            required: true,
            type: "object"
        },
        options: {
            required: true,
            type: "object",
            additionalProperties: false,
            anyOf: [
                { required: ["name"] }
            ],
            properties: {
                name: {
                    required: true,
                    type: "object",
                    additionalProperties: false,
                    anyOf: [
                        { required: ["first"] },
                        { required: ["second"] }
                    ],
                    properties: {
                        first: {
                            required: false,
                            type: "string"
                        },
                        second: {
                            required: false,
                            type: "string"
                        }
                    }
                }
            }
        }
    }
};
