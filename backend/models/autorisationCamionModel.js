import pool from "../config/db.js";

export const getAllAutorisationCamion = async () => {
  const result = await pool.query('SELECT * FROM "autorisationcamion" ORDER BY "id" ASC');
  return result.rows;
};

export const getAutorisationCamionById = async (id) => {
  const result = await pool.query('SELECT * FROM "autorisationcamion" WHERE id = $1', [id]);
  return result.rows[0];
};

export const createAutorisationCamion = async (data) => {
  const {
    numeroAutorisation,
    nomProprietaire,
    telephoneProprietaire,
    adresseProprietaire,
    marqueVehicule,
    modeleVehicule,
    numeroImmatriculation,
    typeTransport,
    itineraire,
    dateDebut,
    dateFin,
    montantTaxe,
    statusPaiement,
    statusAutorisation,
    dateCreation,
    observations
  } = data;

  const result = await pool.query(
    `INSERT INTO "autorisationcamion" (
      numeroAutorisation, nomProprietaire, telephoneProprietaire, adresseProprietaire,
      marqueVehicule, modeleVehicule, numeroImmatriculation, typeTransport, itineraire,
      dateDebut, dateFin, montantTaxe, statusPaiement, statusAutorisation, dateCreation, observations
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      numeroAutorisation, nomProprietaire, telephoneProprietaire, adresseProprietaire,
      marqueVehicule, modeleVehicule, numeroImmatriculation, typeTransport, itineraire,
      dateDebut, dateFin, montantTaxe, statusPaiement, statusAutorisation, dateCreation, observations
    ]
  );
  return result.rows[0];
};

export const updateAutorisationCamion = async (id, data) => {
  const {
    numeroAutorisation,
    nomProprietaire,
    telephoneProprietaire,
    adresseProprietaire,
    marqueVehicule,
    modeleVehicule,
    numeroImmatriculation,
    typeTransport,
    itineraire,
    dateDebut,
    dateFin,
    montantTaxe,
    statusPaiement,
    statusAutorisation,
    observations
  } = data;

  const result = await pool.query(
    `UPDATE "autorisationcamion" SET
      numeroAutorisation=$1, nomProprietaire=$2, telephoneProprietaire=$3, adresseProprietaire=$4,
      marqueVehicule=$5, modeleVehicule=$6, numeroImmatriculation=$7, typeTransport=$8, itineraire=$9,
      dateDebut=$10, dateFin=$11, montantTaxe=$12, statusPaiement=$13, statusAutorisation=$14, observations=$15
      WHERE id=$16 RETURNING *`,
    [
      numeroAutorisation, nomProprietaire, telephoneProprietaire, adresseProprietaire,
      marqueVehicule, modeleVehicule, numeroImmatriculation, typeTransport, itineraire,
      dateDebut, dateFin, montantTaxe, statusPaiement, statusAutorisation, observations, id
    ]
  );
  return result.rows[0];
};

export const deleteAutorisationCamion = async (id) => {
  await pool.query('DELETE FROM "autorisationcamion" WHERE id=$1', [id]);
  return true;
};

export const updateStatusAutorisation = async (id, statusAutorisation) => {
  const result = await pool.query(
    'UPDATE "autorisationcamion" SET statusAutorisation=$1 WHERE id=$2 RETURNING *',
    [statusAutorisation, id]
  );
  return result.rows[0];
};

export const updateStatusPaiement = async (id, statusPaiement) => {
  const result = await pool.query(
    'UPDATE "autorisationcamion" SET statusPaiement=$1 WHERE id=$2 RETURNING *',
    [statusPaiement, id]
  );
  return result.rows[0];
};
