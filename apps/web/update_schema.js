const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const fieldsToUpdate = [
  'minStockThresholdDefault',
  'reorderLevel',
  'minimumStockLevel',
  'maximumStockLevel',
  'physicalQuantity',
  'reservedQuantity',
  'availableQuantity',
  'quantityIn',
  'quantityOut',
  'balanceAfter',
  'requestedQuantity',
  'approvedQuantity',
  'issuedQuantity',
  'orderedQuantity',
  'receivedQuantity',
  'acceptedQuantity',
  'rejectedQuantity',
  'dispatchedQuantity',
  'damagedQuantity',
  'quantity',
  'systemQuantity',
  'adjustmentQuantity',
  'quantityUsed'
];

fieldsToUpdate.forEach(field => {
  // Regex to match field name followed by Float or Float? and optional @default
  const regex = new RegExp(`(\\s+${field}\\s+)Float(\\?)?(\\s+@default\\(([^)]+)\\))?`, 'g');
  schema = schema.replace(regex, (match, p1, p2, p3, p4) => {
    let typeStr = `Decimal${p2 || ''} @db.Decimal(12,3)`;
    if (p4 !== undefined) {
       typeStr += ` @default(${p4})`;
    }
    return `${p1}${typeStr}`;
  });
});

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully.');
