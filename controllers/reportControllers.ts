import { Mascota, Report } from "../associations/associations";

export async function createReport(dataReport, id: number) {
  const { reportName, phoneNumber, moreAbout } = dataReport;
  try {
    const pet = await Mascota.findOne({
      where: {
        id,
      },
    });

    if (pet) {
      const report = await Report.create({
        reportName,
        phoneNumber,
        moreAbout,
        mascotumId: pet.get("id"),
      });
      return {
        success: true,
        data: report,
        message: "Info reportada",
      };
    } else {
      return {
        success: false,
        message: "No hay mascota asociada al id",
      };
    }
  } catch (error) {
    return error;
  }
}
