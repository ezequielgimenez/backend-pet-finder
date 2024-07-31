import { User, Mascota } from "../associations/associations";
import { petDataAlgolia } from "../connectionDB";

import { cloudinary } from "../connectionDB";

export async function createPet(userPet) {
  const {
    userId,
    namePet,
    petImageUrl,
    estadoPet,
    petLat,
    petLong,
    petUbicacion,
  } = userPet;
  //
  const image = await cloudinary.uploader.upload(petImageUrl);
  const urlImage = image.secure_url;
  //
  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (user) {
    //
    const petDB = await Mascota.create({
      userId: user.get("id"),
      namePet,
      petImageUrl: urlImage,
      estadoPet,
      petLat,
      petLong,
      petUbicacion,
    });
    try {
      if (petDB) {
        const petAlgolia = await petDataAlgolia.saveObject({
          objectID: petDB.get("id"),
          namePet,
          petImageUrl: urlImage,
          estadoPet,
          _geoloc: {
            lat: petLat,
            lng: petLong,
          },
          userId: user.get("id"),
          petUbicacion,
        });
        return {
          success: true,
          data: {
            petDB,
          },
          message: "Reporte de mascota creado",
        };
      } else {
        return {
          success: false,
          message: "No se pudo crear mascota",
        };
      }
    } catch (error) {
      return error;
    }
  }
}

export async function mascotasCerca(request) {
  const { lng, lat } = request.query;
  try {
    const mascotasFind = await petDataAlgolia.search("", {
      aroundLatLng: `${lat} , ${lng}`,
      aroundRadius: 40000, //40km
    });

    const mascotasCerca = mascotasFind.hits.map((hit: any) => {
      return {
        objectID: hit.objectID,
        namePet: hit.namePet,
        petImageUrl: hit.petImageUrl,
        _geoloc: hit._geoloc,
        userId: hit.userId,
        petUbicacion: hit.petUbicacion,
      };
    });
    if (mascotasCerca.length > 0) {
      return {
        success: true,
        data: mascotasCerca,
        message: "Se encontraron mascotas",
      };
    } else {
      return {
        success: false,
        message: "No hay mascotas cerca de la ubicacion",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "No hay mascotas cerca de la ubicacion",
      error: error,
    };
  }
}

export async function myPetsAll(request, userId: number) {
  try {
    const myPets = await Mascota.findAll({
      where: {
        userId,
      },
    });

    if (myPets.length > 0) {
      return {
        success: true,
        data: {
          myPets,
        },
        message: "Mascotas encontradas",
      };
    } else {
      return {
        success: false,
        data: {
          myPets: [],
        },
        message: "No se encontraron mascotas",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || "Error al buscar mascotas",
    };
  }
}

export async function eliminarPet(id) {
  try {
    const petDeleted = await Mascota.destroy({
      where: {
        id,
      },
    });
    const petAlgolia = await petDataAlgolia.deleteObject(id);
    return {
      success: true,
      data: petDeleted,
      message: "Reporte de mascota eliminada",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error +
        "no se pudo eliminar el reporte id incorrecto o no hay reportes",
    };
  }
}

export async function actualizarMascota(userPet) {
  const { id, namePet, petImageUrl, estadoPet, petLat, petLong, petUbicacion } =
    userPet;
  //
  try {
    const image = await cloudinary.uploader.upload(petImageUrl);
    const urlImage = image.secure_url;
    //
    const updateMascota = await Mascota.update(
      {
        namePet,
        petImageUrl: urlImage,
        estadoPet,
        petLat,
        petLong,
        petUbicacion,
      },
      {
        where: {
          id,
        },
      }
    );
    if (updateMascota[0] === 1) {
      const updateMascotaAlgolia = await petDataAlgolia.partialUpdateObject({
        objectID: id,
        namePet,
        petImageUrl: urlImage,
        estadoPet,
        _geoloc: {
          lat: petLat,
          lng: petLong,
        },
        petUbicacion,
      });
      return {
        success: true,
        data: updateMascota,
        message: "Update de mascota actualizada correctamente",
      };
    } else {
      return {
        success: false,
        message:
          "Error no se pudo actualizar, no hay mascota asociada a tu id user",
      };
    }
  } catch (error) {
    return error;
  }
}
