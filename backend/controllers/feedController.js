const { Post, PostLike, PostComment, User, Structure, Adhesion } = require('../models');
const { Op } = require('sequelize');
const { creerNotification } = require('../utils/notify');

// Extrait les hashtags (#mot) d'un texte, sans le '#'.
const extraireHashtags = (texte) => {
  const matches = texte.match(/#[\p{L}0-9_]+/gu) || [];
  return [...new Set(matches.map((h) => h.slice(1).toLowerCase()))];
};

const REACTIONS = ['jaime', 'jadore', 'bravo', 'super'];

const formatPost = (post, userId) => {
  const likes = post.likes || [];
  const parType = {};
  REACTIONS.forEach((t) => { parType[t] = 0; });
  likes.forEach((l) => { parType[l.type] = (parType[l.type] || 0) + 1; });
  const maReaction = userId ? likes.find((l) => l.user_id === userId)?.type || null : null;

  return {
    id: post.id,
    contenu: post.contenu,
    image: post.image,
    hashtags: post.hashtags || [],
    lieu: post.lieu,
    createdAt: post.createdAt,
    auteur: post.auteur,
    structure: post.structure,
    nombreLikes: likes.length,
    reactionsParType: parType,
    maReaction,
    nombreCommentaires: post.commentaires ? post.commentaires.length : 0,
  };
};

// GET /api/feed — fil de campus (public en lecture, enrichi si connecté)
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { rows, count } = await Post.findAndCountAll({
      include: [
        { model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo', 'role'] },
        { model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo'] },
        { model: PostLike, as: 'likes', attributes: ['user_id', 'type'] },
        { model: PostComment, as: 'commentaires', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    // Calcule en une seule requête quels auteurs sont présidents d'une structure active,
    // pour afficher un badge "vérifié" sans multiplier les requêtes par publication.
    const auteurIds = [...new Set(rows.map((p) => p.auteur?.id).filter(Boolean))];
    const presidents = await Adhesion.findAll({
      where: { user_id: { [Op.in]: auteurIds }, role_structure: 'president', statut: 'active' },
      attributes: ['user_id'],
    });
    const idsPresidents = new Set(presidents.map((p) => p.user_id));

    const posts = rows.map((p) => {
      const formate = formatPost(p, req.user?.id);
      if (formate.auteur) {
        formate.auteur.verifie = formate.auteur.role === 'admin' || idsPresidents.has(formate.auteur.id);
      }
      return formate;
    });

    return res.json({ posts, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération du fil.', error: error.message });
  }
};

// POST /api/feed — publier un post (texte + hashtags auto-détectés)
exports.createPost = async (req, res) => {
  try {
    const { contenu, lieu, structure_id } = req.body;
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ message: 'Le contenu ne peut pas être vide.' });
    }

    // Si publié au nom d'une structure, vérifie que l'utilisateur en est membre actif
    if (structure_id) {
      const estMembre = await Adhesion.findOne({
        where: { user_id: req.user.id, structure_id, statut: 'active' },
      });
      if (!estMembre) {
        return res.status(403).json({ message: "Vous devez être membre de cette structure pour publier en son nom." });
      }
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await Post.create({
      user_id: req.user.id,
      structure_id: structure_id || null,
      contenu: contenu.trim(),
      lieu: lieu || null,
      image,
      hashtags: extraireHashtags(contenu),
    });

    const postComplet = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] },
        { model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo'] },
        { model: PostLike, as: 'likes', attributes: ['user_id', 'type'] },
        { model: PostComment, as: 'commentaires', attributes: ['id'] },
      ],
    });

    // Détecte les mentions "@Prenom" dans le texte et notifie les utilisateurs correspondants.
    const prenomsMentionnes = [...new Set((contenu.match(/@[\p{L}]+/gu) || []).map((m) => m.slice(1).toLowerCase()))];
    if (prenomsMentionnes.length > 0) {
      const utilisateursMentionnes = await User.findAll({
        where: { id: { [Op.ne]: req.user.id } },
      });
      for (const u of utilisateursMentionnes) {
        if (prenomsMentionnes.includes(u.prenom.toLowerCase())) {
          await creerNotification({
            userId: u.id,
            titre: 'Vous avez été mentionné(e)',
            message: `${req.user.prenom} ${req.user.nom} vous a mentionné(e) dans une publication.`,
            categorie: 'mention',
            lien: '/fil',
          });
        }
      }
    }

    return res.status(201).json({ message: 'Publication envoyée.', post: formatPost(postComplet, req.user.id) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la publication.', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable.' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres publications.' });
    }
    await post.destroy();
    return res.json({ message: 'Publication supprimée.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

// POST /api/feed/:id/like — { type: 'jaime'|'jadore'|'bravo'|'super' } : pose,
// change ou retire (si même type renvoyé) sa réaction sur une publication.
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const type = REACTIONS.includes(req.body.type) ? req.body.type : 'jaime';

    const existant = await PostLike.findOne({ where: { post_id: postId, user_id: req.user.id } });

    if (existant && existant.type === type) {
      await existant.destroy();
      return res.json({ maReaction: null });
    }

    if (existant) {
      existant.type = type;
      await existant.save();
      return res.json({ maReaction: type });
    }

    await PostLike.create({ post_id: postId, user_id: req.user.id, type });

    const post = await Post.findByPk(postId);
    if (post && post.user_id !== req.user.id) {
      await creerNotification({
        userId: post.user_id,
        titre: 'Nouvelle réaction',
        message: `${req.user.prenom} ${req.user.nom} a réagi à votre publication.`,
        categorie: 'reaction',
        lien: '/fil',
      });
    }

    return res.json({ maReaction: type });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la réaction.', error: error.message });
  }
};

// GET /api/feed/:id/comments
exports.getComments = async (req, res) => {
  try {
    const commentaires = await PostComment.findAll({
      where: { post_id: req.params.id },
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
      order: [['createdAt', 'ASC']],
    });
    return res.json({ commentaires });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des commentaires.', error: error.message });
  }
};

// POST /api/feed/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
    }

    const commentaire = await PostComment.create({
      post_id: req.params.id,
      user_id: req.user.id,
      contenu: contenu.trim(),
    });

    const commentaireComplet = await PostComment.findByPk(commentaire.id, {
      include: [{ model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] }],
    });

    return res.status(201).json({ commentaire: commentaireComplet });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'ajout du commentaire.", error: error.message });
  }
};

// GET /api/feed/tendances — hashtags les plus utilisés cette semaine (calculé,
// pas inventé : basé sur les publications réellement créées sur la plateforme)
exports.getTendances = async (req, res) => {
  try {
    const uneSemaine = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.findAll({
      where: { createdAt: { [Op.gte]: uneSemaine } },
      attributes: ['hashtags'],
    });

    const compteur = {};
    posts.forEach((p) => {
      let tags = p.hashtags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch { tags = []; }
      }
      if (!Array.isArray(tags)) return;
      tags.forEach((tag) => {
        compteur[tag] = (compteur[tag] || 0) + 1;
      });
    });

    const tendances = Object.entries(compteur)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return res.json({ tendances });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des tendances.', error: error.message });
  }
};

// GET /api/feed/membres-en-vue — membres les plus actifs (basé sur publications + likes reçus réels)
exports.getMembresEnVue = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] },
        { model: PostLike, as: 'likes', attributes: ['id'] },
      ],
    });

    const scores = {};
    posts.forEach((p) => {
      if (!p.auteur) return;
      const id = p.auteur.id;
      if (!scores[id]) scores[id] = { utilisateur: p.auteur, points: 0 };
      scores[id].points += 1 + (p.likes ? p.likes.length : 0);
    });

    const classement = Object.values(scores)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    return res.json({ membres: classement });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul du classement.', error: error.message });
  }
};

// GET /api/feed/galerie — dernières images publiées sur le fil (galerie du campus)
exports.getGalerie = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { image: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
      limit: 12,
      attributes: ['id', 'image', 'contenu'],
    });
    return res.json({ images: posts });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération de la galerie.', error: error.message });
  }
};
