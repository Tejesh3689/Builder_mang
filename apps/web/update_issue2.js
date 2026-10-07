const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'api', 'materials', 'issue', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newLogic = `      // If a Request ID was provided, mark it as FULFILLED if appropriate
      if (requestId) {
        const reqDoc = await tx.materialRequest.findUnique({
          where: { id: requestId },
          include: { items: true }
        });

        if (reqDoc) {
          if (reqDoc.status !== 'APPROVED' && reqDoc.status !== 'PARTIALLY_ISSUED') {
            throw new Error('Conflict: Request is not in a valid state to be issued');
          }

          let allFullyIssued = true;
          let anyIssued = false;

          for (const reqItem of reqDoc.items) {
            const payloadItem = items.find((i: any) => i.materialId === reqItem.materialId);
            const addedQty = payloadItem ? parseFloat(payloadItem.issuedQuantity) : 0;
            let currentIssued = reqItem.issuedQuantity;

            if (addedQty > 0) {
              const updatedItem = await tx.materialRequestItem.update({
                where: { id: reqItem.id },
                data: { issuedQuantity: { increment: addedQty } }
              });
              currentIssued = updatedItem.issuedQuantity;
              
              if (currentIssued > updatedItem.approvedQuantity) {
                throw new Error(\`Conflict: Cannot issue more than approved quantity for material \${reqItem.materialId}\`);
              }
            }

            if (currentIssued >= reqItem.approvedQuantity && reqItem.approvedQuantity > 0) {
               anyIssued = true;
            } else if (currentIssued > 0) {
               allFullyIssued = false;
               anyIssued = true;
            } else {
               allFullyIssued = false;
            }
          }

          let newStatus = reqDoc.status;
          if (allFullyIssued) newStatus = 'ISSUED';
          else if (anyIssued) newStatus = 'PARTIALLY_ISSUED';
          else newStatus = 'APPROVED';

          if (newStatus !== reqDoc.status) {
            await tx.materialRequest.update({
              where: { id: requestId },
              data: { status: newStatus }
            });
          }
        }
      }`;

// We will replace the whole if (requestId) block.
// I'll just use a regex or string replacement.
const startIdx = content.indexOf('// If a Request ID was provided');
const endIdx = content.indexOf('return newIssue;');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newLogic + '\\n\\n      ' + content.substring(endIdx);
  fs.writeFileSync(filePath, content);
  console.log('Issue updated');
} else {
  console.error('Could not find block');
}
