import { buildObject, getKeyValues } from './path';
import { subfield } from './subfield';

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

  it(`doesn't serialize nested objects by default`, () => {
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
      someArray: [1, 2, 3],
    };
    const result = getKeyValues(value);
    expect(result).toEqual(value);
  });

  it('serializes nested objects when using `subfield`', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someObject: subfield({
        innerNumber: 6,
        innerString: 'string',
        innerObject: {
          value: 7,
        },
      }),
    };
    const result = getKeyValues(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      'someObject.innerNumber': 6,
      'someObject.innerString': 'string',
      'someObject.innerObject': {
        value: 7,
      },
    });
  });

  it('serializes nested arrays when using `subfield`', () => {
    const value = {
      someString: 'string',
      someNumber: 5,
      someArray: subfield([
        6,
        'string',
        [
          {
            value: 7,
          },
        ],
      ]),
    };
    const result = getKeyValues(value);
    expect(result).toEqual({
      someString: 'string',
      someNumber: 5,
      'someArray[0]': 6,
      'someArray[1]': 'string',
      'someArray[2]': value.someArray[2],
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
