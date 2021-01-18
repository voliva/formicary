import { buildObject, getKeyValues } from './path';

describe('getKeyValues', () => {
  it('serializes plain objects', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someDate: new Date(),
    };
    const result = getKeyValues(value);
    expect(result).toEqual(value);
  });

  it('serializes nested objects', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someObject: {
        innerNumber: 6,
        innerString: 'string',
        innerObject: {
          value: 7,
        },
      },
    };
    const result = getKeyValues(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      'someObject.innerNumber': 6,
      'someObject.innerString': 'string',
      'someObject.innerObject.value': 7,
    });
  });

  it('serializes nested arrays', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someArray: [
        6,
        'string',
        [
          {
            value: 7,
          },
        ],
      ],
    };
    const result = getKeyValues(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      'someArray[0]': 6,
      'someArray[1]': 'string',
      'someArray[2][0].value': 7,
    });
  });
});

describe('buildObject', () => {
  it('deserializes plain objects', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someDate: new Date(),
    };
    const result = buildObject(value);
    expect(result).toEqual(value);
  });

  it('deserializes nested objects', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      'someObject.innerNumber': 6,
      'someObject.innerString': 'string',
      'someObject.innerObject.value': 7,
    };
    const result = buildObject(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      someObject: {
        innerNumber: 6,
        innerString: 'string',
        innerObject: {
          value: 7,
        },
      },
    });
  });

  it('deserializes nested arrays', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      'someArray[0]': 6,
      'someArray[1]': 'string',
      'someArray[2][0].value': 7,
    };
    const result = buildObject(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      someArray: [
        6,
        'string',
        [
          {
            value: 7,
          },
        ],
      ],
    });
  });
});
