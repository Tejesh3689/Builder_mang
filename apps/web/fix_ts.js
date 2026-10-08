const fs = require('fs');

const issuePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\issue\\route.ts';
let issueContent = fs.readFileSync(issuePath, 'utf8');

// Fix 1: src/app/api/materials/issue/route.ts(80,13)
issueContent = issueContent.replace(
  'if (matchingReqItem.issuedQuantity + qty > matchingReqItem.approvedQuantity) {',
  'if (matchingReqItem.issuedQuantity.add(qty).gt(matchingReqItem.approvedQuantity)) {'
);

// Fix 2: src/app/api/materials/issue/route.ts(187,64) and (189,26)
//       if (currentIssued > updatedItem.approvedQuantity) {
issueContent = issueContent.replace(
  /if \(currentIssued > updatedItem\.approvedQuantity\) {/g,
  'if (currentIssued.gt(updatedItem.approvedQuantity)) {'
);

// if (currentIssued >= reqItem.approvedQuantity && reqItem.approvedQuantity > 0) {
issueContent = issueContent.replace(
  /if \(currentIssued >= reqItem\.approvedQuantity && reqItem\.approvedQuantity > 0\) {/g,
  'if (currentIssued.gte(reqItem.approvedQuantity) && reqItem.approvedQuantity.gt(0)) {'
);

// else if (currentIssued > 0) {
issueContent = issueContent.replace(
  /else if \(currentIssued > 0\) {/g,
  'else if (currentIssued.gt(0)) {'
);

// Fix 3: src/app/api/materials/issue/route.ts(224,34): error TS2367
// if (!existItem || existItem.issuedQuantity !== parseFloat(item.issuedQuantity)) {
issueContent = issueContent.replace(
  /if \(\!existItem \|\| existItem\.issuedQuantity \!== parseFloat\(item\.issuedQuantity\)\) {/g,
  'if (!existItem || !existItem.issuedQuantity.equals(item.issuedQuantity)) {'
);

fs.writeFileSync(issuePath, issueContent);

// Fix receive/route.ts
const receivePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\receive\\route.ts';
let receiveContent = fs.readFileSync(receivePath, 'utf8');
receiveContent = receiveContent.replace(
  /if \(\!existItem \|\| existItem\.receivedQuantity \!== parseFloat\(item\.receivedQuantity\)\) {/g,
  'if (!existItem || !existItem.receivedQuantity.equals(item.receivedQuantity)) {'
);
fs.writeFileSync(receivePath, receiveContent);

// Fix requests/route.ts
const requestsPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\requests\\route.ts';
if (fs.existsSync(requestsPath)) {
  let reqContent = fs.readFileSync(requestsPath, 'utf8');
  reqContent = reqContent.replace(
    /if \(\!existItem \|\| existItem\.requestedQuantity \!== parseFloat\(item\.requestedQuantity\)\) {/g,
    'if (!existItem || !existItem.requestedQuantity.equals(item.requestedQuantity)) {'
  );
  fs.writeFileSync(requestsPath, reqContent);
}

// Fix attendance/route.ts
const attendancePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\attendance\\route.ts';
let attendanceContent = fs.readFileSync(attendancePath, 'utf8');
attendanceContent = attendanceContent.replace(/employeeId: user\.employeeId/g, 'employeeId: (user as any).employee?.id');
attendanceContent = attendanceContent.replace(/!user\.employeeId/g, '!(user as any).employee?.id');
fs.writeFileSync(attendancePath, attendanceContent);

// Fix attendance/[id]/route.ts
const attendanceIdPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\attendance\\[id]\\route.ts';
let attendanceIdContent = fs.readFileSync(attendanceIdPath, 'utf8');
attendanceIdContent = attendanceIdContent.replace(/existing\.employeeId !== user\.employeeId/g, 'existing.employeeId !== (user as any).employee?.id');
fs.writeFileSync(attendanceIdPath, attendanceIdContent);

// Fix leaves/route.ts
const leavesPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\leaves\\route.ts';
let leavesContent = fs.readFileSync(leavesPath, 'utf8');
leavesContent = leavesContent.replace(/employeeId: user\.employeeId/g, 'employeeId: (user as any).employee?.id');
leavesContent = leavesContent.replace(/!user\.employeeId/g, '!(user as any).employee?.id');
leavesContent = leavesContent.replace(/employeeId !== user\.employeeId/g, 'employeeId !== (user as any).employee?.id');
fs.writeFileSync(leavesPath, leavesContent);

// Fix leaves/[id]/process/route.ts
const leavesProcessPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\leaves\\[id]\\process\\route.ts';
let leavesProcessContent = fs.readFileSync(leavesProcessPath, 'utf8');
leavesProcessContent = leavesProcessContent.replace(/existing\.employeeId !== user\.employeeId/g, 'existing.employeeId !== (user as any).employee?.id');
fs.writeFileSync(leavesProcessPath, leavesProcessContent);

// Fix leaves/balance/route.ts
const leavesBalancePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\leaves\\balance\\route.ts';
let leavesBalanceContent = fs.readFileSync(leavesBalancePath, 'utf8');
leavesBalanceContent = leavesBalanceContent.replace(/!user\.employeeId/g, '!(user as any).employee?.id');
leavesBalanceContent = leavesBalanceContent.replace(/employeeId !== user\.employeeId/g, 'employeeId !== (user as any).employee?.id');
leavesBalanceContent = leavesBalanceContent.replace(/targetEmployeeId = user\.employeeId/g, 'targetEmployeeId = (user as any).employee?.id');
fs.writeFileSync(leavesBalancePath, leavesBalanceContent);

console.log('Fixed typescript errors');
