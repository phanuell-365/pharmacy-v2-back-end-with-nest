import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { DOSE_FORMS, MEDICINE_STRENGTHS } from '../constants';
import { DoseForms } from '../enums';

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

  // @HasOne(() => Inventory, {
  //   onUpdate: 'CASCADE',
  //   onDelete: 'CASCADE',
  // })
  // inventory: Inventory;
  //
  // @HasMany(() => Order, {
  //   onUpdate: 'CASCADE',
  //   onDelete: 'CASCADE',
  // })
  // orders: Order[];
}
