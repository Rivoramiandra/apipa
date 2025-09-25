import * as Model from "../models/autorisationCamionModel.js";

export const getAll = async (req, res) => {
  try {
    const authorizations = await Model.getAllAutorisationCamion();
    res.json(authorizations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des autorisations." });
  }
};

export const getById = async (req, res) => {
  try {
    const authorization = await Model.getAutorisationCamionById(req.params.id);
    res.json(authorization);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération de l'autorisation." });
  }
};

export const create = async (req, res) => {
  try {
    const authorization = await Model.createAutorisationCamion(req.body);
    res.status(201).json(authorization);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de l'autorisation." });
  }
};

export const update = async (req, res) => {
  try {
    const authorization = await Model.updateAutorisationCamion(req.params.id, req.body);
    res.json(authorization);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'autorisation." });
  }
};

export const remove = async (req, res) => {
  try {
    await Model.deleteAutorisationCamion(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'autorisation." });
  }
};

export const patchStatus = async (req, res) => {
  try {
    const { statusAutorisation, statusPaiement } = req.body;
    let result;
    if (statusAutorisation) {
      result = await Model.updateStatusAutorisation(req.params.id, statusAutorisation);
    }
    if (statusPaiement) {
      result = await Model.updateStatusPaiement(req.params.id, statusPaiement);
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
  }
};
