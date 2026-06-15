const productIds = [
  'd77b5276-9fc2-4c3e-bf0e-b000b23e6984',
  'c374b7c4-3dbd-46eb-ab7e-90bfeb5fddff',
  '0a20ffc3-8722-4b14-9c0c-8189bd3330b7'
];

async function main() {
  for (const id of productIds) {
    const url = `http://localhost:4000/api/v1/product/${id}`;
    try {
      console.log(`Hitting product API for ID: ${id}...`);
      const res = await fetch(url);
      const json = await res.json();
      console.log(`Product: "${json.product?.name}" - Images count: ${json.product?.images?.length}`);
    } catch (err) {
      console.error(`Failed for ID ${id}:`, err);
    }
  }
}

main();
