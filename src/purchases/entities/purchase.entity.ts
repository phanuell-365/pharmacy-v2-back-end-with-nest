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
  packSizeQuantity: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  pricePerPackSize: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  totalPackSizePrice: number;

  @ForeignKey(() => Order)
  @Column({ allowNull: false, type: DataType.UUID })
  OrderId: string;

  @BelongsTo(() => Order, 'OrderId')
  order: Order;
}
