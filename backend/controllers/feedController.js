const { Post, PostLike, PostComment, User, Structure, Adhesion } = require('../models');
const { Op } = require('sequelize');

// Extrait les hashtags (#mot) d'un texte, sans le '#'.
const extraireHashtags = (texte) => {
  const matches = texte.match(/#[\p{L}0-9_]+/gu) || [];
  return [...new Set(matches.map((h) => h.slice(1).toLowerCase()))];
};

const formatPost = (post, userId) => ({
  id: post.id,
  contenu: post.contenu,
  image: post.image,
  hashtags: post.hashtags || [],
  lieu: post.lieu,
  createdAt: post.createdAt,
  auteur: post.auteur,
  structure: post.structure,
  nombreLikes: post.likes ? post.likes.length : 0,
  aimeParMoi: userId ? (post.likes || []).some((l) => l.user_id === userId) : false,
  nombreCommentaires: post.commentaires ? post.commentaires.length : 0,
});

// GET /api/feed — fil de campus (public en lecture, enrichi si connecté)
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { rows, count } = await Post.findAndCountAll({
      include: [
        { model: User, as: 'auteur', attributes: ['id', 'nom', 'prenom', 'photo'] },
        { model: Structure, as: 'structure', attributes: ['id', 'nom', 'logo'] },
        { model: PostLike, as: 'likes', attributes: ['user_id'] },
        { model: PostComment, as: 'commentaires', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    const posts = rows.map((p) => formatPost(p, req.user?.id));
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
        { model: PostLike, as: 'likes', attributes: ['user_id'] },
        { model: PostComment, as: 'commentaires', attributes: ['id'] },
      ],
    });

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

// POST /api/feed/:id/like — bascule le like (aimer / ne plus aimer)
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const existant = await PostLike.findOne({ where: { post_id: postId, user_id: req.user.id } });

    if (existant) {
      await existant.destroy();
      return res.json({ liked: false });
    }

    await PostLike.create({ post_id: postId, user_id: req.user.id });
    return res.json({ liked: true });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du like.', error: error.message });
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
