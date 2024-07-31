import { sequelize } from "../connectionDB";
import { DataTypes } from "sequelize";

export const Auth = sequelize.define("auth", {
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  token: DataTypes.STRING,
  expires: DataTypes.DATE,
  userId: DataTypes.INTEGER,
});
