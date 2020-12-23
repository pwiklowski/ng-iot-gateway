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
  },
  type: 'object',
  required: ['deviceUuid', 'variableUuid', 'script'],
};
