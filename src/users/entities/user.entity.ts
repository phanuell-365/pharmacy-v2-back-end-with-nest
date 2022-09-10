import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Role } from '../enums';

@Table({
  tableName: 'Users',
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['password', 'createdAt', 'deletedAt', 'updatedAt'],
    },
  },
})
export class User extends Model {
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
    unique: true,
    allowNull: false,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 10],
    },
  })
  phone: string;

  @Column({
    type: DataType.ENUM,
    values: [
      Role.ADMIN,
      Role.CHIEF_PHARMACIST,
      Role.PHARMACIST,
      Role.PHARMACIST_ASSISTANT,
      Role.PHARMACY_TECHNICIAN,
    ],
    defaultValue: Role.PHARMACIST,
    allowNull: false,
  })
  role: Role;
}
