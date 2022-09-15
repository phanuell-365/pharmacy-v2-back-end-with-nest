import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ORDER_STATUSES } from '../constants';
import { OrderStatuses } from '../enum';
import { Supplier } from '../../suppliers/entities';
import { Medicine } from '../../medicines/entities';

@Table({
  paranoid: true,
  timestamps: true,
  createdAt: 'orderDate',
  defaultScope: {
    attributes: {
      exclude: ['deletedAt', 'updatedAt'],
    },
  },
})
export class Order extends Model {
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
  orderQuantity: number;

  @Column({
    type: DataType.ENUM,
    values: ORDER_STATUSES,
    defaultValue: OrderStatuses.PENDING,
    allowNull: false,
  })
  status: string;

  @ForeignKey(() => Medicine)
  @Column({ allowNull: false, type: DataType.UUID })
  MedicineId: string;

  @BelongsTo(() => Medicine, 'MedicineId')
  medicine: Medicine;

  @ForeignKey(() => Supplier)
  @Column({ allowNull: false, type: DataType.UUID })
  SupplierId: string;

  @BelongsTo(() => Supplier, 'SupplierId')
  supplier: Supplier;

  // @HasMany(() => Purchase, {
  //   onUpdate: 'CASCADE',
  //   onDelete: 'CASCADE',
  // })
  // purchases: Purchase[];
}
