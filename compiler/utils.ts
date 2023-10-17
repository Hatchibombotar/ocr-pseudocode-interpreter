import { ArrayValue, RuntimeValue } from "./runtime/values";

export function valuesToStrings(value: RuntimeValue): string {
    switch (value.type) {
        case "array": {
            return "[" + (value as ArrayValue).value.map(
                (nested_value) => valuesToStrings(nested_value)
            ).join(", ") + "]"
        }
        case "string":
            return '"' + value.value + '"'
        case "integer":
            return value.value
        case "float":
            return Number.isInteger(value.value) ? value.value + ".0" : value.value
        case "boolean":
            return value.value
        case "function":
            return "function"
        case "null":
            return "null"
        case "procedure":
            return "procedure"
        case "native-function":
            return "native-function"
        case "native-method":
            return "native-method"
        case "native-getter":
            return "native-getter"
        default:
            throw Error()
    }
}

// https://stackoverflow.com/questions/26957719/replace-object-value-without-replacing-reference
export function updateObjKeepingRef(sourceObj: any, newObj: any): void {
    Object.keys(newObj).forEach(key => {
        // if value is object and instance is not Date
        if (newObj[key] && typeof newObj[key] === 'object' && sourceObj[key] && !(newObj[key] instanceof Date)) {
            updateObjKeepingRef(sourceObj[key], newObj[key]);
        } else {
            // updating properties
            sourceObj[key] = newObj[key];
        }
    });
}