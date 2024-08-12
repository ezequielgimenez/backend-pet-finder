import * as express from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";

//
//recursos
import * as bodyParser from "body-parser";
import * as sgMail from "@sendgrid/mail";

import * as nodemailer from "nodemailer";
import * as crypto from "crypto";

import { Resend } from "resend";

//
//asociaciones
import { User, Mascota, Report } from "./associations/associations";

//
// controllers
import {
  autenticarToken,
  autenticarUser,
  myMiddlewareUser,
  getMe,
  updatePassword,
} from "./controllers/authControllers";

import { updateUser, verifyEmail } from "./controllers/userControllers";

import {
  actualizarMascota,
  createPet,
  eliminarPet,
  mascotasCerca,
  myPetsAll,
} from "./controllers/mascotaControllers";

import { createReport } from "./controllers/reportControllers";
import { Auth } from "./models/auth";

//const
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//

//
//use
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

app.use(
  cors({
    origin: ["https://pet-finder-21a3b.web.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

///
//////
///
/////////
///
///
///

app.listen(port, () => {
  console.log("Escuchando en el puerto:", port);
});

function hashearPass(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

app.post("/auth", async (req, res) => {
  if (req.body) {
    const user = await autenticarUser(req.body);
    res.json(user);
  } else {
    res.status(400).json("No hay data en el body");
  }
});

app.post("/auth/token", async (req, res) => {
  if (!req.body) {
    res.status(400).json("No se encontro data en el body");
  } else {
    const tokenObject = await autenticarToken(req.body);
    res.json(tokenObject);
  }
});

app.use("/me", (req, res) => {
  const reqUsuario = myMiddlewareUser(req);
  if (reqUsuario) {
    res.json(reqUsuario);
  } else {
    throw "error en el request, no hay data en el header Authorization: [bearer token] o el token es invalido";
  }
});

app.post("/me", async (req, res) => {
  try {
    const userFind = await getMe(req);
    res.json(userFind);
  } catch (error) {
    res.status(400).json("error:", error);
  }
});

app.post("/verify-email", async (req, res) => {
  if (req.body.email) {
    const userEmail = await verifyEmail(req.body);
    res.json(userEmail);
  } else {
    res.status(400).json("No hay data en el body");
  }
});

app.post("/update-data", async (req, res) => {
  if (req.body.userId) {
    const userActualizado = await updateUser(req.body);
    res.json(userActualizado);
  } else {
    res.status(400).json("No hay userId en el cuerpo de la solicitud");
  }
});

app.post("/update-password", async (req, res) => {
  const { userId, password, passwordActual } = req.body;
  if (req.body.userId) {
    const passwordUpdate = await updatePassword(
      userId,
      password,
      passwordActual
    );
    res.json(passwordUpdate);
  } else {
    res.status(400).json("No hay data en el body");
  }
});

app.post("/create-pet", async (req, res) => {
  if (req.body.userId) {
    const petCreated = await createPet(req.body);
    res.json(petCreated);
  } else {
    res.status(400).json("Faltan datos necesarios");
  }
});

app.get("/mascotas-cerca-de", async (req, res) => {
  if (req.query.lng && req.query.lat) {
    const results = await mascotasCerca(req);
    res.json(results);
  } else {
    res.status(400).json("Faltan datos");
  }
});

app.get("/mis-mascotas", async (req, res) => {
  if (req.query.userId) {
    const myPets = await myPetsAll(req, req.query.userId);
    res.json(myPets);
  } else {
    res.status(400).json("Falta la query de userId");
  }
});

app.post("/update-report", async (req, res) => {
  if (req.body.id) {
    const petUpdate = await actualizarMascota(req.body);
    res.json(petUpdate);
  } else {
    res.status(400).json("No hay id de mascota en el body");
  }
});

app.post("/delete-report", async (req, res) => {
  if (req.body.id) {
    const petDeleted = await eliminarPet(req.body.id);
    res.json(petDeleted);
  } else {
    res.status(400).json("No hay id de mascota en el body");
  }
});

app.post("/create-report", async (req, res) => {
  if (req.body.id) {
    const reportCreated = await createReport(req.body, req.body.id);
    res.json(reportCreated);
  } else {
    res.status(400).json("No hay id en el cuerpo del body");
  }
});

app.get("/get-user-pet", async (req, res) => {
  const { id } = req.query;
  try {
    const mascotaAsociada = await Mascota.findOne({
      where: {
        id,
      },
    });

    const userAsociado = await User.findOne({
      where: {
        id: mascotaAsociada.get("userId"),
      },
    });

    if (userAsociado) {
      res.json({
        success: true,
        data: userAsociado,
        message: "Usuario asociado con el id de la mascota encontrado",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No se encontró usuario asociado",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ocurrió un error al procesar la solicitud",
      error: error.message,
    });
  }
});

app.post("/send-email", async (req, res) => {
  const { email, reportName, phoneNumber, moreAbout } = req.body;
  const resend = new Resend("re_Y6HpmXMg_LroQ89SaGPsNh59B1GRCgW6N");

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject:
        "Hola usuario de PetFinder (Informacion sobre su mascota perdida)",
      html: `<p>Nombre del que reporto: ${reportName}<br>Teléfono del usuario que reporto: ${phoneNumber}<br>Información sobre su mascota: ${moreAbout}</p>`,
    });

    // Enviar una respuesta de éxito al cliente
    res.status(200).json({
      success: true,
      message: "Email enviado con la info",
    });
  } catch (error) {
    // Enviar una respuesta de error al cliente
    res.status(500).json({
      error: "Error al enviar el correo",
      details: error.response ? error.response.body.errors : error.message,
    });
  }
});

//////////////////
//////////////////
////////////////////////////////////
//////////////////////////////////////Enviar mail recuperacion password
//////////////////
//////////////////
const transporter = nodemailer.createTransport({
  service: "gmail", // o el servicio que estés usando
  auth: {
    user: "ezequielezequiel9@gmail.com",
    pass: "yrax mnig bkxz hjwm",
  },
});

// Función para validar email
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Función para enviar correo electrónico
const sendResetEmail = async (email, resetLink) => {
  return await transporter.sendMail({
    to: email,
    subject: "Solicitud de restablecimiento de contraseña",
    text: `Has solicitado restablecer tu contraseña. Haz clic en el enlace para restablecer tu contraseña: ${resetLink}`,
  });
};

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Validar el email manualmente
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Debe proporcionar un email válido",
    });
  }

  try {
    // Verificar si el email existe en la base de datos
    const myUser = await User.findOne({ where: { email } });

    if (myUser) {
      // Generar un token de restablecimiento
      const token = crypto.randomBytes(20).toString("hex");
      // Establecer una fecha de expiración (1 hora desde ahora)
      const expires = new Date(Date.now() + 3600000);

      // Guardar el token en la base de datos
      await Auth.update(
        { token, expires },
        { where: { userId: myUser.get("id") } }
      );

      // Crear el enlace de restablecimiento
      const resetLink = `https://pet-finder-21a3b.web.app/change-password/token/${token}`;

      // Enviar el correo electrónico
      await sendResetEmail(email, resetLink);

      return res.status(200).json({
        success: true,
        message: "Enlace de restablecimiento enviado",
      });
    }

    // Respuesta genérica para no revelar información sobre la existencia del email
    return res.status(200).json({
      success: true,
      message:
        "Si el email está registrado, recibirás un enlace de restablecimiento",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token } = req.query; // Token desde la query string
  const { password } = req.body; // Nueva contraseña desde el cuerpo de la solicitud

  try {
    // Buscar el token en la base de datos
    const passwordResetToken = await Auth.findOne({ where: { token } });

    if (!passwordResetToken) {
      return res.json({
        success: false,
        message: "Token invalido o caducado",
      });
    }

    // actualizar la contraseña del usuario
    await passwordResetToken.update(
      { password: hashearPass(password) },
      {
        where: {
          token,
        },
      }
    );
    // Eliminar el token de la base de datos
    await passwordResetToken.update({ token: null }, { where: { token } });

    return res.status(200).json({
      success: true,
      message: "La contraseña ha sido cambiada con exito",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default app;
