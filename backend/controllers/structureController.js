const { Structure, Adhesion, User, Evenement, Annonce, Cotisation } = require('../models');
const { creerNotification } = require('../utils/notify');
const { sendEmail } = require('../utils/mailer');
const { logActivite } = require('../utils/activityLog');
const { Op } = require('sequelize');

// GET /api/structures — accessible au Visiteur (public), avec recherche/filtre
exports.getAllStructures = async (req, res) => {
  try {
    const { search, type } = req.query;
    const where = {};

    if (search) {
      where.nom = { [Op.like]: `%${search}%` };
    }
    if (type) {
      where.type = type;
    }

    const structures = await Structure.findAll({
      where,
      include: [
        { model: User, as: 'createur', attributes: ['id', 'nom', 'prenom'] },
        { model: Adhesion, as: 'adhesions', where: { statut: 'active' }, required: false },
      ],
      order: [['date_creation', 'DESC']],
    });

    const result = structures.map((s) => ({
      id: s.id,
      nom: s.nom,
      description: s.description,
      type: s.type,
      logo: s.logo,
      date_creation: s.date_creation,
      nombre_membres: s.adhesions ? s.adhesions.length : 0,
      est_organe_central: s.est_organe_central,
    }));

    return res.json({ structures: result });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des structures.', error: error.message });
  }
};

// GET /api/structures/:id — détail d'une structure (public, avec infos enrichies si membre)
exports.getStructureById = async (req, res) => {
  try {
    const structure = await Structure.findByPk(req.params.id, {
      include: [
        { model: User, as: 'createur', attributes: ['id', 'nom', 'prenom'] },
        {
          model: Adhesion,
          as: 'adhesions',
          where: { statut: 'active' },
          required: false,
          include: [{ model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
        },
        { model: Evenement, as: 'evenements', order: [['date_debut', 'ASC']] },
        { model: Annonce, as: 'annonces', order: [['date_publication', 'DESC']] },
      ],
    });

    if (!structure) {
      return res.status(404).json({ message: 'Structure introuvable.' });
    }

    let monAdhesion = null;
    if (req.user) {
      monAdhesion = await Adhesion.findOne({
        where: { user_id: req.user.id, structure_id: structure.id },
      });
    }

    return res.json({ structure, monAdhesion });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération de la structure.', error: error.message });
  }
};

// POST /api/structures — création réservée à l'Administrateur ou au président
// de la structure "organe central" (le CEE). Un simple Membre ne peut plus
// créer librement une structure.
exports.createStructure = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const organeCentral = await Structure.findOne({ where: { est_organe_central: true } });
      const estPresidentCEE = organeCentral
        ? await Adhesion.findOne({
            where: {
              user_id: req.user.id,
              structure_id: organeCentral.id,
              role_structure: 'president',
              statut: 'active',
            },
          })
        : null;

      if (!estPresidentCEE) {
        return res.status(403).json({
          message: organeCentral
            ? `Seul le président de "${organeCentral.nom}" peut créer une nouvelle structure.`
            : "Aucun organe central (CEE) n'est encore configuré. Contactez un administrateur.",
        });
      }
    }

    const { nom, description, type } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    const structure = await Structure.create({
      nom,
      description,
      type,
      logo,
      createur_id: req.user.id,
    });

    await Adhesion.create({
      user_id: req.user.id,
      structure_id: structure.id,
      role_structure: 'president',
      statut: 'active',
      date_traitement: new Date(),
    });

    await logActivite({
      userId: req.user.id,
      action: 'Création de structure',
      details: `${req.user.prenom} ${req.user.nom} a créé la structure "${nom}"`,
    });

    return res.status(201).json({ message: 'Structure créée avec succès. Vous en êtes le président.', structure });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création de la structure.', error: error.message });
  }
};

// GET /api/structures/peut-creer — indique au frontend si l'utilisateur connecté
// a le droit de créer une nouvelle structure (admin ou président du CEE).
exports.peutCreerStructure = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ peutCreer: true, raison: 'admin' });
    }

    const organeCentral = await Structure.findOne({ where: { est_organe_central: true } });
    if (!organeCentral) {
      return res.json({ peutCreer: false, raison: 'aucun_organe_central' });
    }

    const estPresidentCEE = await Adhesion.findOne({
      where: {
        user_id: req.user.id,
        structure_id: organeCentral.id,
        role_structure: 'president',
        statut: 'active',
      },
    });

    return res.json({
      peutCreer: !!estPresidentCEE,
      raison: estPresidentCEE ? 'president_cee' : 'non_autorise',
      organeCentral: { id: organeCentral.id, nom: organeCentral.nom },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la vérification des droits.', error: error.message });
  }
};

// PUT /api/structures/:id/organe-central — l'Administrateur désigne LA structure
// mère (le CEE). Retire automatiquement le statut à toute autre structure.
exports.definirOrganeCentral = async (req, res) => {
  try {
    const structure = await Structure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure introuvable.' });

    await Structure.update({ est_organe_central: false }, { where: {} });
    structure.est_organe_central = true;
    await structure.save();

    await logActivite({
      userId: req.user.id,
      action: 'Définition de l’organe central',
      details: `"${structure.nom}" désignée comme organe central (CEE)`,
    });

    return res.json({ message: `"${structure.nom}" est maintenant l'organe central (CEE).`, structure });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

// PUT /api/structures/:id — le président modifie sa structure (description, image...)
exports.updateStructure = async (req, res) => {
  try {
    const structure = await Structure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure introuvable.' });

    const { nom, description, type } = req.body;
    if (req.file) structure.logo = `/uploads/${req.file.filename}`;
    if (nom) structure.nom = nom;
    if (description) structure.description = description;
    if (type) structure.type = type;

    await structure.save();
    return res.json({ message: 'Structure mise à jour.', structure });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

// DELETE /api/structures/:id — le président ou l'admin supprime la structure
exports.deleteStructure = async (req, res) => {
  try {
    const structure = await Structure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure introuvable.' });

    await structure.destroy();

    await logActivite({
      userId: req.user.id,
      action: 'Suppression de structure',
      details: `Structure "${structure.nom}" supprimée`,
    });

    return res.json({ message: 'Structure supprimée avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

// POST /api/structures/:id/adhesions — cas d'utilisation "Adhérer une structure"
exports.demanderAdhesion = async (req, res) => {
  try {
    const structureId = req.params.id;
    const structure = await Structure.findByPk(structureId);
    if (!structure) return res.status(404).json({ message: 'Structure introuvable.' });

    const existante = await Adhesion.findOne({
      where: { user_id: req.user.id, structure_id: structureId },
    });

    if (existante && ['active', 'en_attente'].includes(existante.statut)) {
      return res.status(409).json({ message: 'Demande déjà existante ou adhésion active.' });
    }

    let adhesion;
    if (existante) {
      existante.statut = 'en_attente';
      existante.date_demande = new Date();
      existante.date_traitement = null;
      existante.message = req.body.message || null;
      adhesion = await existante.save();
    } else {
      adhesion = await Adhesion.create({
        user_id: req.user.id,
        structure_id: structureId,
        role_structure: 'membre',
        statut: 'en_attente',
        message: req.body.message || null,
      });
    }

    // Notifie le(s) président(s) de la structure
    const presidents = await Adhesion.findAll({
      where: { structure_id: structureId, role_structure: 'president', statut: 'active' },
    });
    for (const p of presidents) {
      await creerNotification({
        userId: p.user_id,
        titre: 'Nouvelle demande d’adhésion',
        message: `${req.user.prenom} ${req.user.nom} souhaite rejoindre "${structure.nom}".`,
        lien: `/president/structures/${structureId}/demandes`,
      });
    }

    return res.status(201).json({ message: 'Demande d’adhésion envoyée. En attente de validation.', adhesion });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la demande d’adhésion.', error: error.message });
  }
};

// PUT /api/adhesions/:id — le président valide ou rejette une demande
exports.traiterAdhesion = async (req, res) => {
  try {
    const { decision } = req.body; // 'accepter' | 'rejeter'
    const adhesion = await Adhesion.findByPk(req.params.id, {
      include: [{ model: Structure, as: 'structure' }, { model: User, as: 'utilisateur' }],
    });

    if (!adhesion) return res.status(404).json({ message: 'Demande introuvable.' });

    if (req.user.role !== 'admin') {
      const estPresident = await Adhesion.findOne({
        where: {
          user_id: req.user.id,
          structure_id: adhesion.structure_id,
          role_structure: 'president',
          statut: 'active',
        },
      });
      if (!estPresident) {
        return res.status(403).json({ message: 'Accès réservé au président de cette structure.' });
      }
    }

    adhesion.statut = decision === 'accepter' ? 'active' : 'rejetee';
    adhesion.date_traitement = new Date();
    await adhesion.save();

    await creerNotification({
      userId: adhesion.user_id,
      titre: decision === 'accepter' ? 'Adhésion acceptée' : 'Adhésion refusée',
      message:
        decision === 'accepter'
          ? `Votre demande pour "${adhesion.structure.nom}" a été acceptée. Bienvenue !`
          : `Votre demande pour "${adhesion.structure.nom}" a été refusée.`,
    });

    await sendEmail({
      to: adhesion.utilisateur.email,
      subject: `Votre adhésion à ${adhesion.structure.nom}`,
      html: `<p>Bonjour ${adhesion.utilisateur.prenom},</p><p>Votre demande d'adhésion a été ${
        decision === 'accepter' ? 'acceptée' : 'refusée'
      }.</p>`,
    });

    return res.json({ message: 'Demande traitée.', adhesion });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du traitement de la demande.', error: error.message });
  }
};

// GET /api/structures/:id/demandes — le président consulte les demandes en attente
exports.getDemandesEnAttente = async (req, res) => {
  try {
    const demandes = await Adhesion.findAll({
      where: { structure_id: req.params.id, statut: 'en_attente' },
      include: [{ model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'email', 'photo'] }],
      order: [['date_demande', 'ASC']],
    });
    return res.json({ demandes });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des demandes.', error: error.message });
  }
};

// PUT /api/structures/:id/membres/:userId/retirer — le président retire un membre
exports.retirerMembre = async (req, res) => {
  try {
    const { id: structureId, userId } = req.params;
    const adhesion = await Adhesion.findOne({ where: { structure_id: structureId, user_id: userId } });
    if (!adhesion) return res.status(404).json({ message: 'Membre introuvable dans cette structure.' });

    adhesion.statut = 'quittee';
    await adhesion.save();

    await creerNotification({
      userId,
      titre: 'Retrait de la structure',
      message: `Vous avez été retiré(e) de la structure.`,
    });

    return res.json({ message: 'Membre retiré avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du retrait du membre.', error: error.message });
  }
};

// PUT /api/structures/:id/quitter — le membre quitte une structure de lui-même
exports.quitterStructure = async (req, res) => {
  try {
    const adhesion = await Adhesion.findOne({
      where: { structure_id: req.params.id, user_id: req.user.id, statut: 'active' },
    });
    if (!adhesion) return res.status(404).json({ message: "Vous n'êtes pas membre actif de cette structure." });

    if (adhesion.role_structure === 'president') {
      return res.status(400).json({
        message: 'Un président ne peut pas quitter sa structure sans transmettre la présidence. Contactez un administrateur.',
      });
    }

    adhesion.statut = 'quittee';
    await adhesion.save();
    return res.json({ message: 'Vous avez quitté la structure.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la sortie de la structure.', error: error.message });
  }
};

// POST /api/structures/:id/informer — le président informe tous ses membres
exports.informerMembres = async (req, res) => {
  try {
    const { titre, message } = req.body;
    const structure = await Structure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure introuvable.' });

    const membres = await Adhesion.findAll({
      where: { structure_id: req.params.id, statut: 'active' },
    });

    await Promise.all(
      membres.map((m) =>
        creerNotification({
          userId: m.user_id,
          titre: titre || `Information de ${structure.nom}`,
          message,
        })
      )
    );

    return res.json({ message: `Message envoyé à ${membres.length} membre(s).` });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi de l'information.", error: error.message });
  }
};

// GET /api/structures/mes-structures — structures rejointes par l'utilisateur connecté
exports.mesStructures = async (req, res) => {
  try {
    const adhesions = await Adhesion.findAll({
      where: { user_id: req.user.id, statut: 'active' },
      include: [{ model: Structure, as: 'structure' }],
    });
    return res.json({ adhesions });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération de vos structures.', error: error.message });
  }
};
