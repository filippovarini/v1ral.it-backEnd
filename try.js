const insertBlankShops = (maxId, shops) => {
  for (let i = 0; i <= maxId; i++) {
    if (shops[i] && shops[i].shop === i) {
      console.log("pass");
    } else {
      shops.splice(i, 0, { shop: i });
    }
  }

  return shops;
};

const shops = [
  {
    shop: 13,
    financed_so_far: "180",
    total_premiums: 4,
    disruption_index: "2000"
  },
  {
    shop: 15,
    financed_so_far: "28",
    total_premiums: 2,
    disruption_index: "1500"
  },
  {
    shop: 16,
    financed_so_far: "40",
    total_premiums: 2,
    disruption_index: "3000"
  },
  {
    shop: 17,
    financed_so_far: "120",
    total_premiums: 1,
    disruption_index: "500"
  },
  {
    shop: 18,
    financed_so_far: "684",
    total_premiums: 2,
    disruption_index: "200"
  },
  {
    shop: 19,
    financed_so_far: "70",
    total_premiums: 2,
    disruption_index: "1000"
  }
];
