const fs = require('fs');
const path = require('path');

const issueFile = path.join(__dirname, 'src/app/api/materials/issue/route.ts');
const receiveDir = path.join(__dirname, 'src/app/api/materials/receive');
const receiveFile = path.join(receiveDir, 'route.ts');

if (!fs.existsSync(receiveDir)) {
    fs.mkdirSync(receiveDir, { recursive: true });
}

let code = fs.readFileSync(issueFile, 'utf8');

// Modify the code
code = code.replace(/'materials:issue'/g, "'materials:receive'");
code = code.replace(/const \{ ventureId, fromLocationId, requestId, items, purpose, issuedToName, idempotencyKey \} = body;/g, 
    "const { ventureId, stockLocationId, items, vendorName, invoiceNumber, idempotencyKey } = body;\nconst fromLocationId = stockLocationId;");
code = code.replace(/if \(!ventureId \|\| !fromLocationId \|\| !items \|\| !items\.length \|\| !idempotencyKey \|\| typeof idempotencyKey !== 'string'\) \{/g, 
    "if (!ventureId || !stockLocationId || !items || !items.length || !idempotencyKey || typeof idempotencyKey !== 'string') {");
    
code = code.replace(/const location = await prisma.stockLocation.findUnique\(\{ where: \{ id: fromLocationId \} \}\);/g, 
    "const location = await prisma.stockLocation.findUnique({ where: { id: stockLocationId } });");
code = code.replace(/'ISSUE_LOCATION_NOT_FOUND'/g, "'RECEIVE_LOCATION_NOT_FOUND'");
code = code.replace(/'ISSUE_LOCATION_INACTIVE'/g, "'RECEIVE_LOCATION_INACTIVE'");
code = code.replace(/'ISSUE_LOCATION_OUT_OF_SCOPE'/g, "'RECEIVE_LOCATION_OUT_OF_SCOPE'");

code = code.replace(/'ISSUE_MATERIAL_NOT_FOUND'/g, "'RECEIVE_MATERIAL_NOT_FOUND'");
code = code.replace(/'ISSUE_MATERIAL_INACTIVE'/g, "'RECEIVE_MATERIAL_INACTIVE'");

code = code.replace(/parseFloat\(item\.issuedQuantity\)/g, "parseFloat(item.receivedQuantity)");
code = code.replace(/parseFloat\(item\.requestedQuantity \|\| '0'\) \|\| null/g, "parseFloat(item.acceptedQuantity || item.receivedQuantity)");
code = code.replace(/'Invalid issued quantity: must be positive numeric value'/g, "'Invalid received quantity: must be positive numeric value'");

code = code.replace(/const issueNumber = `ISSUE-\${timestamp}\${random}`;/g, "const receiptNumber = `GRN-${timestamp}${random}`;");

// Request verification section - entirely removed
code = code.replace(/\/\/ Request Verification if passed[\s\S]*?(?=const timestamp =)/g, "");

// Replace transaction create
code = code.replace(/const newIssue = await tx\.materialIssue\.create\(\{[\s\S]*?\}\);/g, `const newReceipt = await tx.materialReceipt.create({
          data: {
            id: typeof idempotencyKey === 'string' && idempotencyKey.length === 36 ? idempotencyKey : undefined,
            receiptNumber,
            vendorName,
            invoiceNumber,
            stockLocationId,
            receivedById: (user as any).id,
            items: {
              create: items.map((item: any) => {
                 const rQty = parseFloat(item.receivedQuantity);
                 const aQty = item.acceptedQuantity !== undefined ? parseFloat(item.acceptedQuantity) : rQty;
                 return {
                    materialId: item.materialId,
                    receivedQuantity: rQty,
                    acceptedQuantity: aQty,
                    rejectedQuantity: rQty - aQty,
                    rate: item.rate ? parseFloat(item.rate) : null
                 };
              })
            }
          }
        });`);

// Fix Stock modification
code = code.replace(/availableQuantity: \{ gte: qty \}/g, "/* no upper bound for receive */");
code = code.replace(/availableQuantity: \{ decrement: qty \}/g, "availableQuantity: { increment: qty }");
code = code.replace(/physicalQuantity: \{ decrement: qty \}/g, "physicalQuantity: { increment: qty }");
code = code.replace(/'ISSUE_EXCEEDS_AVAILABLE_STOCK'/g, "'RECEIVE_STOCK_UPDATE_FAILED'");

// MaterialTransaction logic
code = code.replace(/'ISSUE'/g, "'RECEIPT'");
code = code.replace(/quantityIn: 0/g, "quantityIn: qty");
code = code.replace(/quantityOut: qty/g, "quantityOut: 0");
code = code.replace(/newIssue\.id/g, "newReceipt.id");

// Remove Request Item and Status Updates entirely inside transaction
code = code.replace(/\/\/ Request Item and Status Updates[\s\S]*?(?=return newIssue;)/g, "");
code = code.replace(/return newIssue;/g, "return newReceipt;");

// Update Idempotency check in catch
code = code.replace(/prisma\.materialIssue\.findUnique/g, "prisma.materialReceipt.findUnique");
code = code.replace(/existing\.fromLocationId === fromLocationId/g, "existing.stockLocationId === stockLocationId");
code = code.replace(/existing\.requestId === \(requestId \|\| null\)/g, "true");
code = code.replace(/existItem\.issuedQuantity !== parseFloat\(item\.receivedQuantity\)/g, "existItem.receivedQuantity !== parseFloat(item.receivedQuantity)");
code = code.replace(/'ISSUE_IDEMPOTENCY_CONFLICT'/g, "'RECEIVE_IDEMPOTENCY_CONFLICT'");

fs.writeFileSync(receiveFile, code);
console.log('Done creating receive route');
