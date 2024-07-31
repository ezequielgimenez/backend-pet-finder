import { User } from "../associations/associations";
import { userDataAlgolia } from "../connectionDB";

export async function verifyEmail(userData) {
  const email = userData.email;
  const user = await User.findOne({
    where: {
      email,
    },
  });
  if (user) {
    return {
      success: true,
      data: {
        email: user.get("email"),
      },
      message: "Autorizado, el email esta registrado",
    };
  } else {
    return {
      success: false,
      message: "El email ingresado no esta registrado",
    };
  }
}

export async function updateUser(userData) {
  const { userId, localidad, fullName, long, lat } = userData;
  const nuevoValores = { fullName, localidad, lat, long };

  try {
    // Actualiza el usuario en la base de datos
    const [updated] = await User.update(nuevoValores, {
      where: { id: userId },
    });

    if (updated) {
      const user = await User.findOne({ where: { id: userId } });

      // Actualiza los datos en Algolia
      await userDataAlgolia.partialUpdateObject({
        objectID: user.get("id"),
        fullName,
        localidad,
        _geoloc: {
          lat: lat,
          lng: long,
        },
      });

      return {
        success: true,
        data: {
          user,
        },
        message: "Usuario actualizado correctamente",
      };
    } else {
      return {
        success: false,
        message: "No se pudo actualizar, ID inválido",
      };
    }
  } catch (error) {
    console.error("Error al actualizar el usuario en Algolia:", error);
    return {
      success: false,
      message: "Error al actualizar el usuario en Algolia",
      error: error.message,
    };
  }
}
