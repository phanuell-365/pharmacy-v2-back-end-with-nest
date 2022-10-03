import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Order } from '../../orders/entities';

@Table({
  createdAt: 'purchaseDate',
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['deletedAt', 'updatedAt'],
    },
  },
})
export class Purchase extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true,
  })
  id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  purchasedPackSizeQuantity: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  pricePerPackSize: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  issueUnitPerPackSize: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiryDate: Date;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  totalPurchasePrice: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalIssueUnitQuantity: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  profitMarginPercentagePerPackSize: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerPackSize: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  profitMarginPercentagePerIssueUnit: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerIssueUnit: number;

  @ForeignKey(() => Order)
  @Column({ allowNull: false, type: DataType.UUID })
  OrderId: string;

  @BelongsTo(() => Order, 'OrderId')
  order: Order;
}
