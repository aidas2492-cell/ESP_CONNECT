-- ============================================================================
-- ESPConnect — Schéma de base de données MySQL
-- ============================================================================
-- Ce fichier documente et recrée la structure complète de la base utilisée
-- par l'application. Il correspond exactement aux modèles Sequelize définis
-- dans backend/models/ — les deux doivent rester synchronisés si vous
-- modifiez un modèle.
--
-- Deux façons de l'utiliser :
--   1. Automatique (recommandé) : ne rien faire. Au démarrage, le backend
--      (backend/server.js) appelle sequelize.sync({ alter: true }) qui crée
--      /met à jour ces tables tout seul dans une base vide.
--   2. Manuelle : exécutez ce fichier vous-même pour créer les tables sans
--      lancer l'application, par exemple pour inspecter le schéma ou
--      préparer un environnement à l'avance :
--        mysql -u root -p esp_digital < db/schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS esp_digital
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE esp_digital;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Users — comptes de la plateforme (Membre, Président via Adhesions, Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255) NULL,
  `photo` VARCHAR(255) NULL,
  `role` ENUM('membre','admin') NOT NULL DEFAULT 'membre',
  `date_inscription` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Structures — clubs, amicales, commissions sociales
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Structures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('club','amicale_etudiants','amicale_personnel','commission_sociale') NOT NULL DEFAULT 'club',
  `logo` VARCHAR(255) NULL,
  `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `est_organe_central` TINYINT(1) NOT NULL DEFAULT 0,
  `createur_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_structures_createur` FOREIGN KEY (`createur_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Adhesions — demandes/adhésions d'un utilisateur à une structure
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Adhesions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_structure` ENUM('membre','president') NOT NULL DEFAULT 'membre',
  `statut` ENUM('en_attente','active','rejetee','quittee') NOT NULL DEFAULT 'en_attente',
  `date_demande` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_traitement` DATETIME NULL,
  `message` VARCHAR(300) NULL,
  `user_id` INT NOT NULL,
  `structure_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_adhesion_user_structure` (`user_id`, `structure_id`),
  CONSTRAINT `fk_adhesions_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adhesions_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Evenements — événements publiés par une structure
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Evenements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME NULL,
  `lieu` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255) NULL,
  `structure_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_evenements_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Annonces — annonces publiées par une structure (avec échéance optionnelle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Annonces` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `contenu` TEXT NOT NULL,
  `date_publication` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_echeance` DATETIME NULL,
  `structure_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_annonces_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Cotisations — cotisations dues/payées par un membre pour une structure
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Cotisations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `montant` DECIMAL(10,2) NOT NULL,
  `date_echeance` DATE NOT NULL,
  `statut` ENUM('en_attente','payee','en_retard') NOT NULL DEFAULT 'en_attente',
  `mode_paiement` ENUM('especes','wave','orange_money','virement') NULL,
  `date_paiement` DATETIME NULL,
  `structure_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cotisations_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cotisations_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Notifications — notifications in-app reçues par un utilisateur
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `lue` TINYINT(1) NOT NULL DEFAULT 0,
  `lien` VARCHAR(255) NULL,
  `date_envoie` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Messages — messagerie de groupe (canal propre à chaque structure/club)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contenu` TEXT NOT NULL,
  `structure_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_messages_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- ActivityLogs — journal d'activités consulté par l'Administrateur
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ActivityLogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT NULL,
  `user_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_activitylogs_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Posts — publications du fil de campus
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contenu` TEXT NOT NULL,
  `image` VARCHAR(255) NULL,
  `hashtags` JSON NULL,
  `lieu` VARCHAR(255) NULL,
  `user_id` INT NOT NULL,
  `structure_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_structure` FOREIGN KEY (`structure_id`) REFERENCES `Structures`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- PostLikes — "J'aime" sur une publication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PostLikes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_postlike_user_post` (`user_id`, `post_id`),
  CONSTRAINT `fk_postlikes_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_postlikes_post` FOREIGN KEY (`post_id`) REFERENCES `Posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- PostComments — commentaires sur une publication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PostComments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contenu` VARCHAR(500) NOT NULL,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_postcomments_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_postcomments_post` FOREIGN KEY (`post_id`) REFERENCES `Posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- DMConversations — conversations privées (messages directs et groupes façon WhatsApp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `DMConversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('direct','group') NOT NULL,
  `nom` VARCHAR(255) NULL,
  `image` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- DMParticipants — membres d'une conversation privée/groupe
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `DMParticipants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('admin','membre') NOT NULL DEFAULT 'membre',
  `dernier_acces_a` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `conversation_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_participant_conv_user` (`conversation_id`, `user_id`),
  CONSTRAINT `fk_dmparticipants_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `DMConversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dmparticipants_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- DMMessages — messages échangés dans une conversation privée/groupe
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `DMMessages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contenu` TEXT NOT NULL,
  `conversation_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dmmessages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `DMConversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dmmessages_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
