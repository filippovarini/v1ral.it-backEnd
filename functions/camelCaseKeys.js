/** Turn snake_case string into camelCase */
const camelCaseKey = key => {
  // Remove multiple _
  const snakeChar = "_";
  let newKey = key;
  while (newKey.indexOf(snakeChar) !== -1) {
    const snakeCharIndex = newKey.indexOf(snakeChar);

    // replace only first occurrance
    newKey = newKey.replace(snakeChar, "");

    const str1 = newKey.substring(0, snakeCharIndex);
    const str2 = newKey.substring(snakeCharIndex + 1);
    newKey = str1 + newKey.charAt(snakeCharIndex).toUpperCase() + str2;
  }
  return newKey;
};

/** Turn snake_case into camelCase (response are in camel case)
 * @param obj Object whose keys need to be converted
 * @return obj unmodified but with converted keys
 */
const camelCase = obj => {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = camelCaseKey(key);
    newObj[newKey] = value;
  }
  return newObj;
};

module.exports = camelCase;
