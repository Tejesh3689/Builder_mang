-- AlterTable
ALTER TABLE "material_consumption_items" ALTER COLUMN "quantityUsed" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_issue_items" ALTER COLUMN "requestedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "approvedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "issuedQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_receipt_items" ALTER COLUMN "orderedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "receivedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "acceptedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "rejectedQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_request_items" ALTER COLUMN "requestedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "approvedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "issuedQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_return_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_stocks" ALTER COLUMN "physicalQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "reservedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "availableQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_transactions" ALTER COLUMN "quantityIn" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "quantityOut" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "material_transfer_items" ALTER COLUMN "dispatchedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "receivedQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "damagedQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "reorderLevel" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "minimumStockLevel" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "maximumStockLevel" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "stock_adjustment_items" ALTER COLUMN "systemQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "physicalQuantity" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "adjustmentQuantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "venture_settings" ALTER COLUMN "minStockThresholdDefault" SET DATA TYPE DECIMAL(12,3);

