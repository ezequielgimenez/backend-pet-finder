import { User } from "../models/users";
import { Mascota } from "../models/mascotas";
import { Report } from "../models/reports";

User.hasMany(Mascota);
Mascota.hasMany(Report);
Mascota.belongsTo(User);

export { User, Mascota, Report };
