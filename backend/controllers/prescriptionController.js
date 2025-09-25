// controllers/prescriptionController.js
import Prescription from '../models/prescriptionModel.js';

const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.getAll();
    res.json(prescriptions);
  } catch (err) {
    console.error("Erreur lors de la récupération des prescriptions:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export { getAllPrescriptions };
