const shit = [{ a: 1 }, { a: 1 }, { a: 1 }, { a: 2 }];

function onlyUnique(value, index, self) {
  return self.indexOf(value).includes(value);
}

const a = shit
  .map(shi => shi.a)
  .filter((value, i, self) => {
    return self.indexOf(value) === i;
  });

console.log(a);
