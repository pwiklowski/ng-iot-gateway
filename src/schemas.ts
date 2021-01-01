import { JSONSchema7 } from 'json-schema';

export const RuleSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
    },
    deviceUuid: {
      type: 'string',
    },
    variableUuid: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    script: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  type: 'object',
  required: ['deviceUuid', 'variableUuid', 'script', 'name'],
};

export const PresetSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    variables: {
      type: 'array',
      properties: {
        deviceUuid: {
          type: 'string',
        },
        variableUuid: {
          type: 'string',
        },
        value: {
          type: 'string',
        },
        additionalProperties: false,
      },
      required: ['deviceUuid', 'variableUuid', 'value'],
    },
  },
  type: 'object',
  required: ['variables', 'name'],
};

export const AliasSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  additionalProperties: false,
  properties: {
    deviceUuid: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  type: 'object',
  required: ['deviceUuid', 'name'],
};
