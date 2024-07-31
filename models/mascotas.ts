import { sequelize } from "../connectionDB";
import { DataTypes } from "sequelize";

export const Mascota = sequelize.define("mascota", {
  namePet: DataTypes.STRING,
  petImageUrl: DataTypes.STRING,
  estadoPet: DataTypes.STRING,
  petLat: DataTypes.DECIMAL,
  petLong: DataTypes.DECIMAL,
  petUbicacion: DataTypes.STRING,
});
