import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";
dotenv.config();

//sequelize
export const sequelize = new Sequelize(process.env.TOKEN_SEQUELIZE);

sequelize.sync({ alter: true }).then((data) => {
  console.log(data);
});

// hello_algolia.js
import algoliasearch from "algoliasearch";

// Connect and authenticate with your Algolia app
const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_TOKEN);

// Create a new index and add a record
export const userDataAlgolia = client.initIndex("users");

export const petDataAlgolia = client.initIndex("mascotas");

//Cloudinary
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
