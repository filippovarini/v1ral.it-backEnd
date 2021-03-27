const a = {
  a: { b: 1, c: 2 },
  b: { b: 1, c: 2 },
  c: { b: 1, c: 2 },
  d: { b: 1, c: 2 }
};

for (const [key, value] of Object.entries(a)) {
  console.log(key);
  console.log(value);
}
