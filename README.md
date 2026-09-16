# Limited Links

Încarci un `.zip` cu un site static, alegi câte zile să fie online și primești un link de forma
`https://<proiect>.vercel.app/s/<24-caractere-aleatoare>/`. După expirare linkul afișează „Link expirat”.

## Deploy pe Vercel
1. `npx vercel` în acest folder (sau push pe GitHub + Import în Vercel).
2. Vercel → proiect → **Storage** → **Create** → **Blob**, cu acces **Private**, apoi leagă-l de proiect
   (setează automat `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables**: `CRON_SECRET` (un șir lung aleator).
4. Redeploy (`npx vercel --prod`).

## Local
```
cp .env.example .env.local   # completează valorile
npm run dev
```

## Reguli pentru ZIP
- trebuie să conțină `index.html` (în rădăcină sau într-un singur folder principal)
- folosește căi relative (`style.css`, nu `/style.css`)
- maxim 200 MB

Un cron zilnic (03:00 UTC) șterge fișierele site-urilor expirate.
