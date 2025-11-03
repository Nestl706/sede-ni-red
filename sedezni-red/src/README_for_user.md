Sedezni red - hitri vodič

Datoteke v ZIP:
- package.json
- vite.config.js
- public/index.html
- src/ (main.jsx, App.jsx, firebase.js, styles.css)
- .env.example
- firestore.rules
- README_for_user.md

Korak 1 - Ustvari Firebase projekt
1. Pojdi na https://console.firebase.google.com/ in ustvari nov projekt.
2. V Authentication > Sign-in method omogoči 'Email link (passwordless)'.
3. V Firestore ustvarite bazo v 'Native mode'.
4. V Project settings > Your apps > Add web app - kopiraj config (apiKey, authDomain, projectId, appId).
5. V Firestore > Rules prilepi vsebino iz firestore.rules in objavi.

Korak 2 - Ustvari Git repo (GitHub ali GitLab)
1. Ustvari prazen repo in vanj naloži vse datoteke iz ZIP (ali uporabi Vercel Git upload).

Korak 3 - Deploy na Vercel
1. Prijavi se/ustvari račun na https://vercel.com/ (priporočeno: prijava z GitHub/GitLab).
2. Klikni 'New Project' -> Import Git Repository -> izberi repo.
3. Build settings: Framework: Vite (auto), Build command: npm run build, Output directory: dist
4. V Environment Variables (v Vercel dashboard) dodaj vrednosti iz .env.example (VITE_FIREBASE_...) in VITE_TEACHER_EMAIL=nestl.skitek@gost.bic-lj.si
5. Klikni Deploy. Po nekaj minutah bo URL aktiven.

Korak 4 - Prva uporaba
1. Obišči URL aplikacije.
2. Kot admin: vpiši svoj email nestl.skitek@gost.bic-lj.si v obrazec za prijavo in odpri povezavo, da vstopiš.
3. Preklopi v Admin način in ustvarite test (nastavi rows in cols).
4. Pošlji URL sošolcem; vnesejo svoj email, prejmejo povezavo in rezervirajo en stol.

Če želiš, ti pošljem še natančna korak-po-koraku navodila za:
- kreacijo Firebase projekta z zaslonskimi posnetki (če želiš),
- ali za GitLab namesto GitHub/Vercel.
