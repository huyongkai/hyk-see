export function isEmpty(value) {
  return (
    (variableTypeDetection.isString(value) && value.trim() === "") ||
    value === undefined ||
    value === null
  );
}

export const variableTypeDetection = {
  isNumber: isType("Number"),
  isString: isType("String"),
  isBoolean: isType("Boolean"),
  isNull: isType("Null"),
  isUndefined: isType("Undefined"),
  isSymbol: isType("Symbol"),
  isArray: isType("Array"),
  isObject: isType("Object"),
  isFunction: isType("Function"),
  isProcess: isType("process"),
  isWindow: isType("Window"),
};

function isType(type) {
  return function (value) {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
  };
}

export function isError(error) {
  switch (Object.prototype.toString.call(error)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
      return true;
    default:
      return false;
  }
}

export function isExistProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
