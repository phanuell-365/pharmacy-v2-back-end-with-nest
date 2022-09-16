import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { SalesStatus } from '../enums';
import { SALES_STATUS } from '../constants';
import { Medicine } from '../../medicines/entities';
import { Customer } from '../../customers/entities';

@Table({
  createdAt: 'saleDate',
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['deletedAt', 'updatedAt'],
    },
  },
})
export class Sale extends Model {
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
  issueUnitQuantity: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitPrice: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalPrice: number;

  @Column({
    type: DataType.ENUM,
    values: SALES_STATUS,
    defaultValue: SalesStatus.ISSUED,
  })
  status: string;

  @ForeignKey(() => Medicine)
  @Column({ allowNull: false, type: DataType.UUID })
  MedicineId: string;

  @BelongsTo(() => Medicine, 'MedicineId')
  medicine: Medicine;

  @ForeignKey(() => Customer)
  @Column({ allowNull: false, type: DataType.UUID })
  CustomerId: string;

  @BelongsTo(() => Customer, 'CustomerId')
  customer: Customer;
}
