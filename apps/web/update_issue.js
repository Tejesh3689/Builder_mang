const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'api', 'materials', 'issue', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldLogic = `      // If a Request ID was provided, mark it as FULFILLED if appropriate (simplified logic)
      if (requestId) {
        await tx.materialRequest.updateMany({
          where: { id: requestId, status: 'APPROVED' },
          data: { status: 'ISSUED' }
        });
      }`;

const newLogic = `      // If a Request ID was provided, mark it as FULFILLED if appropriate
      if (requestId) {
        const reqDoc = await tx.materialRequest.findUnique({
          where: { id: requestId },
          include: { items: true }
        });

        if (reqDoc) {
          let allFullyIssued = true;
          let anyIssued = false;

          for (const reqItem of reqDoc.items) {
            const payloadItem = items.find((i: any) => i.materialId === reqItem.materialId);
            const addedQty = payloadItem ? parseFloat(payloadItem.issuedQuantity) : 0;
            const newIssuedQty = reqItem.issuedQuantity + addedQty;

            if (addedQty > 0) {
              await tx.materialRequestItem.update({
                where: { id: reqItem.id },
                data: { issuedQuantity: { increment: addedQty } }
              });
            }

            if (newIssuedQty >= reqItem.approvedQuantity && reqItem.approvedQuantity > 0) {
               anyIssued = true;
            } else if (newIssuedQty > 0) {
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

content = content.replace(oldLogic, newLogic);
// wait, line endings might be \r\n
content = content.replace(oldLogic.replace(/\n/g, '\r\n'), newLogic.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content);
console.log('Done!');
