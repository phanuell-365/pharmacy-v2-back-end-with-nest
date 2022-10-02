export interface MedicineWithStockDto {
  id: string;
  name: string;
  doseForm: string;
  strength: string;
  levelOfUse: number;
  therapeuticClass: string;
  packSize: string;
  issueUnitPurchasePrice: number;
  issueUnitSellingPrice: number;
  profitPerIssueUnit: number;
  issueQuantity: number;
  issueUnitPerPackSize: number;
  packSizePurchasePrice: number;
  packSizeSellingPrice: number;
  profitPerPackSize: number;
  packSizeQuantity: number;
  expiryDate: Date;
}
