import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Medicine } from '../../medicines/entities';

@Table({
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'deletedAt', 'updatedAt'],
    },
  },
})
export class Stock extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true,
  })
  id: string;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitPurchasePrice: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitSellingPrice: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerIssueUnit: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  issueQuantity: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitPerPackSize: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  packSize: string;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  packSizePurchasePrice: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  packSizeSellingPrice: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerPackSize: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 0,
  })
  packSizeQuantity: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiryDate: Date;

  @ForeignKey(() => Medicine)
  @Column({ allowNull: false, type: DataType.UUID })
  MedicineId: string;

  @BelongsTo(() => Medicine)
  medicine: Medicine;
}
