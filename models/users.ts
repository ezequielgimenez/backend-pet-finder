import { DataTypes, DatabaseError } from "sequelize";
import { sequelize } from "../connectionDB";

export const User = sequelize.define("user", {
  fullName: DataTypes.STRING,
  email: DataTypes.STRING,
  localidad: DataTypes.STRING,
  lat: DataTypes.DECIMAL,
  long: DataTypes.DECIMAL,
});
