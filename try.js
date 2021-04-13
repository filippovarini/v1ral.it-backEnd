const images = [1, 2, 3, 4, 5, 6];
let values = images.reduce((acc, image, i) => {
  return (acc += (i == 0 ? "" : ", ") + `($1, '${image}')`);
}, "");

let values1 = images.map(image => `($1, '${image}')`).join(", ");

console.log(values);
console.log(values1);
