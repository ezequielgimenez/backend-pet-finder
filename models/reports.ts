import { sequelize } from "../connectionDB";
import { DataTypes } from "sequelize";

export const Report = sequelize.define("report", {
  reportName: DataTypes.STRING,
  phoneNumber: DataTypes.STRING,
  moreAbout: DataTypes.TEXT,
});
