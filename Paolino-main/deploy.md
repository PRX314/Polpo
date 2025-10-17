## 🔧 12. Comandi Utili

# Restart services
sudo systemctl restart nginx

# Logs
sudo tail -f /var/log/nginx/error.log
pm2 logs progetto

# SSL renewal test
sudo certbot renew --dry-run

## 🎯 Future Improvements

- **CDN**: Cloudflare per performance immagini (60+ files)
- **Backup**: Database automatici
- **Monitoring**: Uptime monitoring esterno
- **Analytics**: Google Analytics/Tag Manager
- **SEO**: Sitemap.xml automatico

**Deploy Guide Complete** ✅


# Guida in pochi fronzoli
1) deploy con Netsons: comprare dominio, assicurarsi che ci siano i nameserver e configurare il DNS per connettersi all'IP della VPS (bisogna aspettare diverse ore prima di passare alla fase successiva --> meglio farlo subito)
2) configurare Nginx: guardare la configurazione di questo progetto e chiedere a Claude di assicurarsi che sia giusta per le API
3) certificato SSL
sudo certbot --nginx -d polpopoli.it -d www.polpopoli.it
4) configurare jenkins (copiare configurazione di questo progetto)
5) assicurarsi che Nginx punti a jenkins workspace e assicurarsi che ci siano i permessi necessari
  # 1. Aggiungi l'utente nginx (www-data) al gruppo jenkins
  sudo usermod -a -G jenkins www-data

  # 2. Imposta permessi sulla directory workspace
  sudo chmod -R 755 /var/lib/jenkins/workspace/polpopoli

  # 3. Assicurati che jenkins sia owner dei file
  sudo chown -R jenkins:jenkins /var/lib/jenkins/workspace/polpopoli

  # 4. Dai permessi di lettura al gruppo per nginx
  sudo find /var/lib/jenkins/workspace/polpopoli/frontend/dist -type d -exec chmod 755 {} \;
  sudo find /var/lib/jenkins/workspace/polpopoli/frontend/dist -type f -exec chmod 644 {} \;

  # 5. Riavvia nginx per applicare il nuovo gruppo
  sudo systemctl restart nginx

  # 6. Verifica che nginx possa accedere
  sudo -u www-data ls -la /var/lib/jenkins/workspace/polpopoli/frontend/dist
  
6) lanciare pm2 (basta lanciare pm2 save)
extra: l'hashtag 12 può tornare molto comodo per i soliti comandi di riavvio nginx eccetera

Più avanti bisognerà vedere come creare una nuova VPS ma in teoria è tutto identico. Se ho capito bene i cambiamenti sono questi:
1) cambia l'IP per la connessione dominio --> VPS
2) ci sarà un altro ssh per connettersi al terminale dell'altra VPS
3) dovrò installare tutto il necessario sulla VPS (let's encrypt, node.js, pm2, probabilmente altro)

