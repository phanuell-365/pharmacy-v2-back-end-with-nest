import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { DOSE_FORMS, MEDICINE_STRENGTHS } from '../constants';
import { DoseForms } from '../enums';
import { Order } from '../../orders/entities';
import { Sale } from '../../sales/entities';

@Table({
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'deletedAt', 'updatedAt'],
    },
  },
})
export class Medicine extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true,
  })
  id: string;

  // provided during a medicine creation

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.ENUM,
    values: DOSE_FORMS,
    allowNull: false,
  })
  doseForm: DoseForms;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isValidStrength(value) {
        if (!MEDICINE_STRENGTHS.some((strength) => value.includes(strength))) {
          throw new Error('Invalid strength');
        }
      },
    },
  })
  strength: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      isGreaterThanOne(value: number) {
        if (value <= 0) {
          throw new Error('Invalid level of use. Level of use <= 0');
        }
      },
    },
  })
  levelOfUse: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  therapeuticClass: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  packSize: string;

  // provided during a purchase

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitPurchasePrice: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitSellingPrice: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerIssueUnit: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitQuantity: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  issueUnitPerPackSize: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  packSizePurchasePrice: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  packSizeSellingPrice: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  profitPerPackSize: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  packSizeQuantity: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    // set tomorrow's date as the default expiry date
    defaultValue: new Date(new Date().setDate(new Date().getDate() + 1)),
  })
  expiryDate: Date;

  @HasMany(() => Order, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  orders: Order[];

  @HasMany(() => Sale, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  sales: Sale[];
}
