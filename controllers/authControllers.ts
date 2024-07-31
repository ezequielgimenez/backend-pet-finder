import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

import { User, Mascota, Report } from "../associations/associations";
import { Auth } from "../models/auth";
import { userDataAlgolia } from "../connectionDB";

dotenv.config();

//
let secret = process.env.SECRET_CRYPTO;
//
function hashearPass(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function verifyEmailWithHunter(email) {
  const apiKey = process.env.HUNTER_API_KEY;
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

export async function autenticarUser(userData) {
  const { fullName, email, password, localidad } = userData;

  try {
    const info = await verifyEmailWithHunter(email);
    if (info.data.result !== "deliverable") {
      throw new Error("Email inexistente, usa un correo electrónico válido");
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  // Crear el usuario y la autenticación
  const [user, userCreated] = await User.findOrCreate({
    where: { email },
    defaults: { fullName, email, localidad },
  });

  const [auth, authCreated] = await Auth.findOrCreate({
    where: { userId: user.get("id") },
    defaults: {
      email,
      password: hashearPass(password),
      userId: user.get("id"),
    },
  });

  if (userCreated) {
    await userDataAlgolia.saveObject({
      objectID: user.get("id"),
      fullName,
      email,
      localidad,
    });
    return {
      success: true,
      data: { user },
      message: "Usuario registrado exitosamente",
    };
  } else {
    return {
      success: false,
      message: "El email ya está registrado",
    };
  }
}

export async function autenticarToken(dataAuth) {
  const { email, password } = dataAuth;

  try {
    const auth = await Auth.findOne({
      where: {
        email,
        password: hashearPass(password),
      },
    });
    const user = await User.findOne({
      where: {
        id: auth.get("userId"),
      },
    });
    if (auth) {
      const token = jwt.sign({ user }, secret);
      return {
        success: true,
        data: {
          token: token,
        },
        message: "Inicio de sesion exitosamente ",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Verifica que el email o password sean correctos",
    };
  }
}

export function myMiddlewareUser(request) {
  if (request.get("Authorization")) {
    const token = request.get("Authorization").split(" ")[1];

    try {
      const data = jwt.verify(token, secret);
      request.usuario = data.user;
      return {
        success: true,
        data: {
          user: request.usuario,
        },
        message: "Token verificado exitosamente ",
      };
    } catch (error) {
      return {
        success: false,
        message: "Verifica que el token sea correcto",
      };
    }
  }
}

export async function getMe(request) {
  if (request.usuario) {
    const id = request.usuario.id;
    const userFind = await User.findOne({
      where: {
        id,
      },
    });
    return userFind;
  } else {
    throw "Error no hay data en el request.usuario";
  }
}

export async function updatePassword(
  userId: number,
  password: string,
  passwordActual: string
) {
  const passwordActualHash = hashearPass(passwordActual);
  const update = {
    password: hashearPass(password),
  };
  try {
    const updatePassword = await Auth.update(update, {
      where: {
        id: userId,
        password: passwordActualHash,
      },
    });
    if (updatePassword[0] !== 0) {
      return {
        success: true,
        data: updatePassword,
        message: "Se actualizo la contraseña correctamente",
      };
    } else {
      return {
        success: false,
        message: "Ocurrio un error al actualizar, password no es correcto",
      };
    }
  } catch (error) {
    return error;
  }
}
