const IS_SUBFIELD = Symbol("is subfield");

const setSubfield = (obj: any) => {
  obj[IS_SUBFIELD] = true;
  return obj;
};

export const subfield = <T extends object>(obj: T): T =>
  Array.isArray(obj) ? setSubfield([...obj]) : setSubfield({ ...obj });

export const isSubfield = (obj: any) => IS_SUBFIELD in obj;
