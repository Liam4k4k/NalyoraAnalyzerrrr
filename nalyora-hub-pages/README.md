# Le Hub des joueurs Nalyora

Site communautaire statique, conçu pour être hébergé gratuitement avec GitHub Pages.

## Publication

1. Crée un dépôt **public** sur GitHub.
2. Copie **tout le contenu de ce dossier** à la racine du dépôt, y compris le dossier caché `.github`.
3. Envoie les fichiers sur la branche `main`.
4. Dans GitHub, ouvre **Settings → Pages** et sélectionne **GitHub Actions** comme source de publication.
5. Dans l’onglet **Actions**, attends la fin de « Publier le Hub Nalyora sur GitHub Pages ».
6. GitHub affichera l’adresse du site dans **Settings → Pages**. Elle sera généralement de la forme `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

Le dépôt doit rester public pour utiliser GitHub Pages gratuitement avec GitHub Free. Aucune compilation ni installation n’est nécessaire.

## Contenu

- `index.html` : accueil, annuaire, classement interactif et pages dédiées aux joueurs, aux guildes et aux annonces.
- `styles.css` : palette bleu saphir, thèmes clair/sombre, contrôles harmonisés, cartes de guildes et mise en page adaptée au mobile.
- `app.js` : joueurs en ligne, profils à onglets, classements avec choix de catégorie, annuaire paginé des guildes et carrousel automatique de toutes les enchères actives.
- `.github/workflows/pages.yml` : publication automatique à chaque mise à jour de `main`.

Le site récupère le thème, les polices et les images directement depuis `nalyora.fr`. Les modules de données nécessitent une connexion Internet et dépendent de la disponibilité des services Nalyora. Les pages de guilde, de profil et d’annonce ont des liens directs dans l’adresse du navigateur. Le marché permet aussi de rechercher et trier les annonces actives. La page d’accueil contient le lien officiel Nalyora ; aucune adresse de serveur Minecraft ni bouton de copie d’IP n’y figure. Les profils affichent la première et la dernière connexion : aucune durée de jeu n’est inventée.

Le Hub est un site communautaire non affilié au serveur Nalyora.
